-- One transaction lock orders cart/stock writes and expiry cleanup consistently.
-- Commerce RPC transactions are short; reads of the catalogue do not take this lock.
create or replace function app_private.commerce_lock() returns void language sql volatile security definer set search_path='' as $$ select pg_advisory_xact_lock(734211, 6); $$;
revoke all on function app_private.commerce_lock() from public;


create or replace function app_private.release_expired_inventory_reservations() returns integer language plpgsql security definer set search_path = '' as $$
declare v_count integer := 0; r record;
begin perform app_private.commerce_lock();
  for r in select distinct ir.cart_item_id from public.inventory_reservations ir where ir.status = 'active' and ir.expires_at <= timezone('utc', now()) loop
    perform app_private.commerce_release_item_reservations(r.cart_item_id, 999, 'Cart reservation expired', 'expired'); v_count := v_count + 1;
  end loop;
  for r in select c.id from public.carts c where c.status = 'active' and c.expires_at is not null and c.expires_at <= timezone('utc', now()) for update loop
    perform app_private.commerce_release_item_reservations(ci.id, 999, 'Cart expired', 'expired') from public.cart_items ci where ci.cart_id = r.id;
    update public.carts set status = 'expired', updated_at = timezone('utc', now()) where id = r.id; delete from public.cart_items where cart_id=r.id;
  end loop;
  return v_count;
end; $$;

create or replace function app_private.commerce_cart_snapshot(p_guest_token_hash text default null) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_cart_id uuid; v_auth boolean := (select auth.uid()) is not null; v_lines jsonb := '[]'::jsonb; v_subtotal bigint := 0; v_discount jsonb; v_discount_pkr bigint := 0; v_shipping bigint := 0; v_total bigint := 0; v_item_count integer := 0; v_shipping_rule public.shipping_rules%rowtype; v_cod_enabled boolean := false;
begin perform app_private.commerce_lock(); if (select auth.uid()) is not null and app_private.commerce_customer_id() is null then raise exception using errcode='42501',message='customer_unavailable'; end if;
  perform app_private.release_expired_inventory_reservations();
  if v_auth then v_cart_id := app_private.commerce_claim_guest_cart(p_guest_token_hash); else v_cart_id := app_private.commerce_cart_id(p_guest_token_hash, false); end if;
  if v_cart_id is null then return jsonb_build_object('cart_id', null, 'authenticated', v_auth, 'lines', '[]'::jsonb, 'item_count', 0, 'quote', jsonb_build_object('subtotal_pkr',0,'discount_pkr',0,'shipping_pkr',0,'total_pkr',0,'discount_code',null,'discount_name',null,'discount_error',null,'cod_eligible',true,'estimated_days_min',2,'estimated_days_max',7,'free_shipping_threshold_pkr',null,'flat_fee_pkr',0), 'reservation_minutes', app_private.commerce_reservation_minutes()); end if;
  select coalesce(jsonb_agg(jsonb_build_object('variant_id', q.variant_id,'product_slug', q.product_slug,'product_name', q.product_name,'variant_title', q.variant_title,'unit_price_pkr', q.unit_price_pkr,'compare_at_price_pkr', q.compare_at_price_pkr,'quantity', q.quantity,'line_total_pkr', q.unit_price_pkr * q.quantity,'media_path', q.media_path,'track_inventory', q.track_inventory,'reserved_quantity', q.reserved_quantity,'max_quantity', q.max_quantity,'stock_state', q.stock_state,'reservation_expires_at', q.reservation_expires_at) order by q.created_at), '[]'::jsonb), coalesce(sum(q.unit_price_pkr * q.quantity),0)::bigint, coalesce(sum(q.quantity),0)::integer into v_lines, v_subtotal, v_item_count
  from (select ci.created_at, ci.variant_id, p.slug product_slug, p.name product_name, pv.title variant_title, pv.price_pkr unit_price_pkr, pv.compare_at_price_pkr, ci.quantity, pm.storage_path media_path, pv.track_inventory, coalesce(res.reserved_quantity,0)::integer reserved_quantity, case when pv.track_inventory then least(99, coalesce(stock.available_quantity,0) + coalesce(res.reserved_quantity,0)) else 99 end::integer max_quantity, case when not pv.track_inventory then 'available' when coalesce(res.reserved_quantity,0) >= ci.quantity then 'reserved' when coalesce(stock.available_quantity,0) + coalesce(res.reserved_quantity,0) >= ci.quantity then 'revalidation_required' else 'unavailable' end stock_state, res.reservation_expires_at
    from public.cart_items ci join public.product_variants pv on pv.id = ci.variant_id and pv.status = 'active' join public.products p on p.id = pv.product_id and p.status = 'active' and p.published_at is not null and p.published_at <= timezone('utc', now())
    left join lateral (select pm2.storage_path from public.product_media pm2 where pm2.product_id=p.id and (pm2.variant_id is null or pm2.variant_id=pv.id) and pm2.media_type='image' order by (pm2.variant_id=pv.id) desc, pm2.is_primary desc, pm2.position asc limit 1) pm on true
    left join lateral (select sum(ir.quantity)::integer reserved_quantity, min(ir.expires_at) reservation_expires_at from public.inventory_reservations ir where ir.cart_item_id=ci.id and ir.status='active' and ir.expires_at > timezone('utc', now())) res on true
    left join lateral (select sum(ib.available)::integer available_quantity from public.inventory_balances ib join public.inventory_locations il on il.id=ib.location_id and il.is_active where ib.variant_id=pv.id) stock on true
    where ci.cart_id=v_cart_id) q;
  perform app_private.commerce_release_item_reservations(ci.id, 999, 'Unpublished selection removed', 'released') from public.cart_items ci join public.product_variants pv on pv.id=ci.variant_id join public.products p on p.id=pv.product_id where ci.cart_id=v_cart_id and (pv.status <> 'active' or p.status <> 'active' or p.published_at is null or p.published_at > timezone('utc',now()));
  delete from public.cart_items ci using public.product_variants pv, public.products p where ci.cart_id=v_cart_id and pv.id=ci.variant_id and p.id=pv.product_id and (pv.status <> 'active' or p.status <> 'active' or p.published_at is null or p.published_at > timezone('utc',now()));
  v_discount := app_private.commerce_discount_quote(v_cart_id); if coalesce((v_discount->>'valid')::boolean,false) then v_discount_pkr := coalesce((v_discount->>'amount_pkr')::bigint,0); end if;
  select sr.* into v_shipping_rule from public.shipping_rules sr join public.shipping_zones sz on sz.id=sr.zone_id where sr.is_active and sz.is_active and (sr.starts_at is null or sr.starts_at <= timezone('utc', now())) and (sr.ends_at is null or sr.ends_at > timezone('utc', now())) order by sz.is_nationwide desc, sr.created_at desc limit 1;
  if v_shipping_rule.id is not null and v_item_count > 0 then v_shipping := v_shipping_rule.flat_fee_pkr; if coalesce((v_discount->>'free_shipping')::boolean,false) then v_shipping := 0; elsif v_shipping_rule.free_shipping_threshold_pkr is not null and greatest(0,v_subtotal-v_discount_pkr) >= v_shipping_rule.free_shipping_threshold_pkr then v_shipping := 0; end if; end if;
  v_total := greatest(0,v_subtotal-v_discount_pkr)+v_shipping; select coalesce((value #>> '{}')::boolean,false) into v_cod_enabled from public.system_settings where key='payments.cod_enabled';
  return jsonb_build_object('cart_id', v_cart_id,'authenticated', v_auth,'lines', v_lines,'item_count', v_item_count,'reservation_minutes', app_private.commerce_reservation_minutes(),'quote', jsonb_build_object('subtotal_pkr', v_subtotal,'discount_pkr', v_discount_pkr,'shipping_pkr', v_shipping,'total_pkr', v_total,'discount_code', v_discount->>'code','discount_name', v_discount->>'name','discount_error', case when (v_discount->>'code') is not null and not coalesce((v_discount->>'valid')::boolean,false) then v_discount->>'reason' else null end,'cod_eligible', v_cod_enabled and (v_shipping_rule.id is null or (v_total >= v_shipping_rule.cod_min_order_pkr and (v_shipping_rule.cod_max_order_pkr is null or v_total <= v_shipping_rule.cod_max_order_pkr))),'estimated_days_min', coalesce(v_shipping_rule.estimated_days_min,2),'estimated_days_max', coalesce(v_shipping_rule.estimated_days_max,7),'free_shipping_threshold_pkr', v_shipping_rule.free_shipping_threshold_pkr,'flat_fee_pkr', coalesce(v_shipping_rule.flat_fee_pkr,0)));
end; $$;

create or replace function app_private.commerce_cart_set_quantity(p_guest_token_hash text, p_variant_id uuid, p_quantity integer) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_cart_id uuid; begin perform app_private.commerce_lock(); if p_quantity is null or p_variant_id is null then raise exception using errcode='22023',message='invalid_quantity'; end if; if (select auth.uid()) is not null and app_private.commerce_customer_id() is null then raise exception using errcode='42501',message='customer_unavailable'; end if; perform app_private.release_expired_inventory_reservations(); if (select auth.uid()) is not null then v_cart_id := app_private.commerce_claim_guest_cart(p_guest_token_hash); else if not app_private.commerce_valid_guest_hash(p_guest_token_hash) then raise exception using errcode='22023',message='guest_cart_token_required'; end if; v_cart_id := app_private.commerce_cart_id(p_guest_token_hash, true); end if; perform app_private.commerce_set_cart_quantity(v_cart_id,p_variant_id,p_quantity); return public.commerce_cart_snapshot(p_guest_token_hash); end; $$;

create or replace function app_private.commerce_cart_add(p_guest_token_hash text, p_variant_id uuid, p_quantity integer) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_cart_id uuid; v_existing integer; begin perform app_private.commerce_lock(); if p_quantity is null or p_variant_id is null then raise exception using errcode='22023',message='invalid_quantity'; end if; if (select auth.uid()) is not null and app_private.commerce_customer_id() is null then raise exception using errcode='42501',message='customer_unavailable'; end if; if p_quantity < 1 or p_quantity > 99 then raise exception using errcode='22023',message='invalid_quantity'; end if; perform app_private.release_expired_inventory_reservations(); if (select auth.uid()) is not null then v_cart_id := app_private.commerce_claim_guest_cart(p_guest_token_hash); else if not app_private.commerce_valid_guest_hash(p_guest_token_hash) then raise exception using errcode='22023',message='guest_cart_token_required'; end if; v_cart_id := app_private.commerce_cart_id(p_guest_token_hash,true); end if; select coalesce(quantity,0) into v_existing from public.cart_items where cart_id=v_cart_id and variant_id=p_variant_id for update; v_existing := coalesce(v_existing,0); perform app_private.commerce_set_cart_quantity(v_cart_id,p_variant_id,v_existing+p_quantity); return public.commerce_cart_snapshot(p_guest_token_hash); end; $$;

create or replace function app_private.commerce_cart_merge_lines(p_guest_token_hash text, p_lines jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_cart_id uuid; v_variant uuid; v_qty integer; v_existing integer; r record; begin perform app_private.commerce_lock(); if (select auth.uid()) is not null and app_private.commerce_customer_id() is null then raise exception using errcode='42501',message='customer_unavailable'; end if; if p_lines is null or jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) > 30 then raise exception using errcode='22023',message='invalid_cart_lines'; end if; perform app_private.release_expired_inventory_reservations(); if (select auth.uid()) is not null then v_cart_id := app_private.commerce_claim_guest_cart(p_guest_token_hash); else if not app_private.commerce_valid_guest_hash(p_guest_token_hash) then raise exception using errcode='22023',message='guest_cart_token_required'; end if; v_cart_id := app_private.commerce_cart_id(p_guest_token_hash,true); end if; for r in select value from jsonb_array_elements(p_lines) loop begin v_variant := (r.value->>'variantId')::uuid; v_qty := greatest(1,least(99,(r.value->>'quantity')::integer)); exception when others then raise exception using errcode='22023',message='invalid_cart_line'; end; select coalesce(quantity,0) into v_existing from public.cart_items where cart_id=v_cart_id and variant_id=v_variant for update; v_existing := coalesce(v_existing,0); perform app_private.commerce_set_cart_quantity(v_cart_id,v_variant,least(99,v_existing+v_qty)); end loop; return public.commerce_cart_snapshot(p_guest_token_hash); end; $$;

create or replace function app_private.commerce_cart_apply_discount(p_guest_token_hash text, p_code text) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_cart_id uuid; v_discount_id uuid; v_quote jsonb; begin perform app_private.commerce_lock(); if (select auth.uid()) is not null and app_private.commerce_customer_id() is null then raise exception using errcode='42501',message='customer_unavailable'; end if; if (select auth.uid()) is not null then v_cart_id := app_private.commerce_claim_guest_cart(p_guest_token_hash); else v_cart_id := app_private.commerce_cart_id(p_guest_token_hash,false); end if; if v_cart_id is null then return public.commerce_cart_snapshot(p_guest_token_hash); end if; if nullif(trim(p_code),'') is null then update public.carts set discount_id=null,updated_at=timezone('utc',now()) where id=v_cart_id; return public.commerce_cart_snapshot(p_guest_token_hash); end if; select id into v_discount_id from public.discounts where code=trim(p_code)::extensions.citext limit 1; if v_discount_id is null then raise exception using errcode='P0001',message='discount_not_found'; end if; update public.carts set discount_id=v_discount_id,updated_at=timezone('utc',now()) where id=v_cart_id; v_quote := app_private.commerce_discount_quote(v_cart_id); if not coalesce((v_quote->>'valid')::boolean,false) then update public.carts set discount_id=null,updated_at=timezone('utc',now()) where id=v_cart_id; raise exception using errcode='P0001',message=coalesce(v_quote->>'reason','discount_not_eligible'); end if; return public.commerce_cart_snapshot(p_guest_token_hash); end; $$;

create or replace function app_private.commerce_wishlist_set(p_variant_id uuid, p_saved boolean) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_customer uuid; v_wishlist uuid; begin perform app_private.commerce_lock(); v_customer := app_private.commerce_customer_id(); if v_customer is null then raise exception using errcode='42501',message='authentication_required'; end if; if p_saved is null or p_variant_id is null then raise exception using errcode='22023',message='invalid_wishlist_item'; end if; if p_saved then if not exists(select 1 from public.product_variants pv join public.products p on p.id=pv.product_id where pv.id=p_variant_id and pv.status='active' and p.status='active' and p.published_at is not null and p.published_at <= timezone('utc',now())) then raise exception using errcode='P0001',message='variant_unavailable'; end if; select id into v_wishlist from public.wishlists where customer_id=v_customer and is_default order by created_at limit 1 for update; if v_wishlist is null then insert into public.wishlists(customer_id,name,is_default) values(v_customer,'Saved',true) returning id into v_wishlist; end if; if not exists(select 1 from public.wishlist_items where wishlist_id=v_wishlist and variant_id=p_variant_id) and (select count(*) from public.wishlist_items where wishlist_id=v_wishlist)>=50 then raise exception using errcode='22023',message='too_many_wishlist_items'; end if; insert into public.wishlist_items(wishlist_id,variant_id) values(v_wishlist,p_variant_id) on conflict do nothing; else select id into v_wishlist from public.wishlists where customer_id=v_customer and is_default order by created_at limit 1; if v_wishlist is not null then delete from public.wishlist_items where wishlist_id=v_wishlist and variant_id=p_variant_id; end if; end if; return public.commerce_wishlist_snapshot(); end; $$;

create or replace function app_private.commerce_wishlist_merge(p_variant_ids uuid[]) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_id uuid; begin perform app_private.commerce_lock(); if coalesce(array_length(p_variant_ids,1),0)>50 then raise exception using errcode='22023',message='too_many_wishlist_items'; end if; foreach v_id in array coalesce(p_variant_ids,'{}'::uuid[]) loop if exists(select 1 from public.product_variants pv join public.products p on p.id=pv.product_id where pv.id=v_id and pv.status='active' and p.status='active' and p.published_at<=timezone('utc',now())) then perform public.commerce_wishlist_set(v_id,true); end if; end loop; return public.commerce_wishlist_snapshot(); end; $$;

create or replace function app_private.commerce_set_cart_quantity(p_cart_id uuid, p_variant_id uuid, p_quantity integer) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_item_id uuid; v_existing_quantity integer := 0; v_reserved_quantity integer := 0; v_track_inventory boolean; v_gap integer; v_expiry timestamptz := timezone('utc', now()) + make_interval(days => app_private.commerce_cart_expiry_days());
begin
  if p_quantity is null or p_quantity < 0 or p_quantity > 99 then raise exception using errcode = '22023', message = 'invalid_quantity'; end if;
  if p_quantity = 0 then
    select ci.id into v_item_id from public.cart_items ci where ci.cart_id=p_cart_id and ci.variant_id=p_variant_id for update;
    if v_item_id is not null then perform app_private.commerce_release_item_reservations(v_item_id,999,'Removed from cart','released'); delete from public.cart_items where id=v_item_id; end if;
    update public.carts set last_activity_at=timezone('utc',now()), expires_at=v_expiry, updated_at=timezone('utc',now()) where id=p_cart_id;
    return null;
  end if;
  if not exists(select 1 from public.cart_items where cart_id=p_cart_id and variant_id=p_variant_id) and (select count(*) from public.cart_items where cart_id=p_cart_id)>=30 then raise exception using errcode='22023',message='too_many_cart_items'; end if;
  select pv.track_inventory into v_track_inventory from public.product_variants pv join public.products p on p.id = pv.product_id where pv.id = p_variant_id and pv.status = 'active' and p.status = 'active' and p.published_at is not null and p.published_at <= timezone('utc', now());
  if v_track_inventory is null then raise exception using errcode = 'P0001', message = 'variant_unavailable'; end if;
  select ci.id, ci.quantity into v_item_id, v_existing_quantity from public.cart_items ci where ci.cart_id = p_cart_id and ci.variant_id = p_variant_id for update;
  if v_item_id is null and p_quantity > 0 then insert into public.cart_items(cart_id, variant_id, quantity) values (p_cart_id, p_variant_id, p_quantity) returning id into v_item_id; v_existing_quantity := 0; end if;
  if v_item_id is null then return null; end if;
  if v_track_inventory then
    select coalesce(sum(ir.quantity), 0)::integer into v_reserved_quantity from public.inventory_reservations ir where ir.cart_item_id = v_item_id and ir.status = 'active' and ir.expires_at > timezone('utc', now());
    v_gap := p_quantity - v_reserved_quantity;
    if v_gap > 0 then perform app_private.commerce_reserve_item(p_cart_id, v_item_id, p_variant_id, v_gap);
    elsif v_gap < 0 then perform app_private.commerce_release_item_reservations(v_item_id, -v_gap, 'Cart quantity reduced', 'released'); end if;
  else perform app_private.commerce_release_item_reservations(v_item_id, 999, 'Inventory tracking disabled', 'released'); end if;
  if p_quantity = 0 then
    perform app_private.commerce_release_item_reservations(v_item_id, 999, 'Removed from cart', 'released'); delete from public.cart_items where id = v_item_id; v_item_id := null;
  else update public.cart_items set quantity = p_quantity, updated_at = timezone('utc', now()) where id = v_item_id; end if;
  update public.inventory_reservations set expires_at = timezone('utc', now()) + make_interval(mins => app_private.commerce_reservation_minutes()), updated_at = timezone('utc', now()) where cart_id = p_cart_id and status = 'active';
  update public.carts set last_activity_at = timezone('utc', now()), expires_at = v_expiry, updated_at = timezone('utc', now()) where id = p_cart_id;
  return v_item_id;
end; $$;


create table public.commerce_import_receipts (
  guest_token_hash text not null check(guest_token_hash ~ '^[a-f0-9]{64}$'),
  import_id uuid not null,
  created_at timestamptz not null default now(),
  primary key(guest_token_hash, import_id)
);
alter table public.commerce_import_receipts enable row level security;
revoke all on public.commerce_import_receipts from anon, authenticated;
grant all on public.commerce_import_receipts to service_role;

create or replace function app_private.commerce_cart_import(p_guest_token_hash text,p_import_id uuid,p_lines jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 perform app_private.commerce_lock();
 if not app_private.commerce_valid_guest_hash(p_guest_token_hash) or p_import_id is null then raise exception using errcode='22023',message='invalid_import'; end if;
 if not exists(select 1 from public.commerce_import_receipts where guest_token_hash=p_guest_token_hash and import_id=p_import_id) then
   perform app_private.commerce_cart_merge_lines(p_guest_token_hash,p_lines);
   insert into public.commerce_import_receipts(guest_token_hash,import_id) values(p_guest_token_hash,p_import_id);
 end if;
 return public.commerce_cart_snapshot(p_guest_token_hash);
end; $$;
create function public.commerce_cart_import(p_guest_token_hash text,p_import_id uuid,p_lines jsonb) returns jsonb language sql volatile security invoker set search_path='' as $$ select app_private.commerce_cart_import(p_guest_token_hash,p_import_id,p_lines); $$;

create or replace function app_private.commerce_wishlist_preview(p_variant_ids uuid[]) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_lines jsonb;
begin
 if coalesce(array_length(p_variant_ids,1),0)>50 then raise exception using errcode='22023',message='too_many_wishlist_items'; end if;
 select coalesce(jsonb_agg(jsonb_build_object('variant_id',pv.id,'product_slug',p.slug,'product_name',p.name,'variant_title',pv.title,'unit_price_pkr',pv.price_pkr,'media_path',pm.storage_path,'max_quantity',case when pv.track_inventory then least(99,coalesce(stock.available,0)) else 99 end) order by array_position(p_variant_ids,pv.id)),'[]'::jsonb) into v_lines
 from public.product_variants pv join public.products p on p.id=pv.product_id
 left join lateral(select pm2.storage_path from public.product_media pm2 where pm2.product_id=p.id and (pm2.variant_id is null or pm2.variant_id=pv.id) and pm2.media_type='image' order by (pm2.variant_id=pv.id) desc,pm2.is_primary desc,pm2.position limit 1) pm on true
 left join lateral(select sum(ib.available)::integer available from public.inventory_balances ib join public.inventory_locations il on il.id=ib.location_id and il.is_active where ib.variant_id=pv.id) stock on true
 where pv.id=any(coalesce(p_variant_ids,'{}'::uuid[])) and pv.status='active' and p.status='active' and p.published_at is not null and p.published_at<=timezone('utc',now());
 return jsonb_build_object('lines',v_lines);
end; $$;
create function public.commerce_wishlist_preview(p_variant_ids uuid[]) returns jsonb language sql stable security invoker set search_path='' as $$ select app_private.commerce_wishlist_preview(p_variant_ids); $$;

create or replace function app_private.commerce_wishlist_snapshot() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_customer uuid; v_ids uuid[];
begin
 v_customer:=app_private.commerce_customer_id();
 if v_customer is null then raise exception using errcode='42501',message='authentication_required'; end if;
 select array_agg(wi.variant_id order by wi.created_at desc) into v_ids from public.wishlist_items wi join public.wishlists w on w.id=wi.wishlist_id where w.customer_id=v_customer and w.is_default;
 return app_private.commerce_wishlist_preview(v_ids) || jsonb_build_object('authenticated',true);
end; $$;
create or replace function app_private.commerce_wishlist_move_to_cart(p_guest_token_hash text,p_variant_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_cart jsonb;
begin
 perform app_private.commerce_lock();
 v_cart:=app_private.commerce_cart_add(p_guest_token_hash,p_variant_id,1);
 if (select auth.uid()) is not null then perform app_private.commerce_wishlist_set(p_variant_id,false); end if;
 return v_cart;
end; $$;
create function public.commerce_wishlist_move_to_cart(p_guest_token_hash text,p_variant_id uuid) returns jsonb language sql volatile security invoker set search_path='' as $$ select app_private.commerce_wishlist_move_to_cart(p_guest_token_hash,p_variant_id); $$;


revoke all on function public.commerce_cart_import(text,uuid,jsonb) from public;
revoke all on function app_private.commerce_cart_import(text,uuid,jsonb) from public;
grant execute on function public.commerce_cart_import(text,uuid,jsonb) to anon,authenticated;
grant execute on function app_private.commerce_cart_import(text,uuid,jsonb) to anon,authenticated;

revoke all on function public.commerce_wishlist_preview(uuid[]) from public;
revoke all on function app_private.commerce_wishlist_preview(uuid[]) from public;
grant execute on function public.commerce_wishlist_preview(uuid[]) to anon,authenticated;
grant execute on function app_private.commerce_wishlist_preview(uuid[]) to anon,authenticated;

revoke all on function public.commerce_wishlist_move_to_cart(text,uuid) from public;
revoke all on function app_private.commerce_wishlist_move_to_cart(text,uuid) from public;
grant execute on function public.commerce_wishlist_move_to_cart(text,uuid) to anon,authenticated;
grant execute on function app_private.commerce_wishlist_move_to_cart(text,uuid) to anon,authenticated;
