alter table public.carts add column if not exists discount_id uuid references public.discounts(id) on delete set null;
create index if not exists carts_discount_idx on public.carts(discount_id) where discount_id is not null;

create table if not exists public.inventory_reservations (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  cart_item_id uuid not null references public.cart_items(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  location_id uuid not null references public.inventory_locations(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  status text not null default 'active' check (status in ('active','released','expired','converted')),
  expires_at timestamptz not null,
  released_at timestamptz,
  release_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check ((status = 'active' and released_at is null) or status <> 'active')
);
create unique index if not exists inventory_reservations_active_item_location_idx on public.inventory_reservations(cart_item_id, location_id) where status = 'active';
create index if not exists inventory_reservations_cart_active_idx on public.inventory_reservations(cart_id, expires_at) where status = 'active';
create index if not exists inventory_reservations_expiry_idx on public.inventory_reservations(expires_at) where status = 'active';
create trigger inventory_reservations_updated_at before update on public.inventory_reservations for each row execute function app_private.set_updated_at();
alter table public.inventory_reservations enable row level security;
revoke all on public.inventory_reservations from anon, authenticated;
grant all on public.inventory_reservations to service_role;
create policy super_admin_full_access_inventory_reservations on public.inventory_reservations for all to authenticated using (app_private.is_super_admin()) with check (app_private.is_super_admin());
grant select on public.inventory_reservations to authenticated;

insert into public.system_settings(key, value, is_public, description) values
('commerce.cart_reservation_minutes', '30'::jsonb, true, 'Minutes an active cart inventory reservation remains valid after a cart mutation.'),
('commerce.cart_expiry_days', '30'::jsonb, true, 'Days an inactive cart is retained before expiry.')
on conflict (key) do nothing;

create or replace function app_private.commerce_reservation_minutes() returns integer language sql stable security definer set search_path = '' as $$
  select greatest(5, least(120, coalesce((select (value #>> '{}')::integer from public.system_settings where key = 'commerce.cart_reservation_minutes'), 30)));
$$;
create or replace function app_private.commerce_cart_expiry_days() returns integer language sql stable security definer set search_path = '' as $$
  select greatest(1, least(90, coalesce((select (value #>> '{}')::integer from public.system_settings where key = 'commerce.cart_expiry_days'), 30)));
$$;
create or replace function app_private.commerce_customer_id() returns uuid language sql stable security definer set search_path = '' as $$
  select c.id from public.customers c where c.user_id = (select auth.uid()) and c.status = 'active' limit 1;
$$;
create or replace function app_private.commerce_valid_guest_hash(p_hash text) returns boolean language sql immutable set search_path = '' as $$
  select p_hash is not null and p_hash ~ '^[0-9a-f]{64}$';
$$;
create or replace function app_private.commerce_cart_id(p_guest_token_hash text, p_create boolean default false) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_customer_id uuid; v_cart_id uuid; v_expiry timestamptz := timezone('utc', now()) + make_interval(days => app_private.commerce_cart_expiry_days());
begin
  v_customer_id := app_private.commerce_customer_id();
  if v_customer_id is not null then
    select c.id into v_cart_id from public.carts c where c.customer_id = v_customer_id and c.status = 'active' order by c.updated_at desc limit 1;
    if v_cart_id is null and p_create then insert into public.carts(customer_id, guest_token_hash, expires_at) values (v_customer_id, null, v_expiry) returning id into v_cart_id; end if;
    return v_cart_id;
  end if;
  if not app_private.commerce_valid_guest_hash(p_guest_token_hash) then return null; end if;
  select c.id into v_cart_id from public.carts c where c.guest_token_hash = p_guest_token_hash and c.status = 'active' limit 1;
  if v_cart_id is null and p_create then
    insert into public.carts(customer_id, guest_token_hash, expires_at) values (null, p_guest_token_hash, v_expiry)
    on conflict (guest_token_hash) do update set status = 'active', last_activity_at = timezone('utc', now()), expires_at = excluded.expires_at, updated_at = timezone('utc', now()) returning id into v_cart_id;
  end if;
  return v_cart_id;
end; $$;

create or replace function app_private.commerce_release_item_reservations(p_cart_item_id uuid, p_quantity integer, p_reason text, p_final_status text default 'released') returns integer language plpgsql security definer set search_path = '' as $$
declare v_remaining integer := greatest(0, p_quantity); v_release integer; v_released integer := 0; v_on_hand integer; v_reserved integer; r record;
begin
  if p_final_status not in ('released','expired','converted') then raise exception using errcode = '22023', message = 'invalid_reservation_status'; end if;
  for r in select ir.* from public.inventory_reservations ir where ir.cart_item_id = p_cart_item_id and ir.status = 'active' order by ir.expires_at asc, ir.created_at asc for update loop
    exit when v_remaining <= 0;
    v_release := least(v_remaining, r.quantity);
    update public.inventory_balances ib set reserved = greatest(0, ib.reserved - v_release), updated_at = timezone('utc', now()) where ib.variant_id = r.variant_id and ib.location_id = r.location_id returning ib.on_hand, ib.reserved into v_on_hand, v_reserved;
    if not found then raise exception using errcode = '23503', message = 'inventory_balance_missing'; end if;
    insert into public.inventory_ledger(variant_id, location_id, event_type, delta_reserved, balance_on_hand, balance_reserved, reference_type, reference_id, note, actor_user_id)
    values (r.variant_id, r.location_id, 'reservation_release', -v_release, v_on_hand, v_reserved, 'cart_item', p_cart_item_id, left(p_reason, 500), (select auth.uid()));
    if v_release = r.quantity then
      update public.inventory_reservations set status = p_final_status, released_at = timezone('utc', now()), release_reason = left(p_reason, 500), updated_at = timezone('utc', now()) where id = r.id;
    else update public.inventory_reservations set quantity = quantity - v_release, updated_at = timezone('utc', now()) where id = r.id; end if;
    v_remaining := v_remaining - v_release; v_released := v_released + v_release;
  end loop;
  return v_released;
end; $$;

create or replace function app_private.commerce_reserve_item(p_cart_id uuid, p_cart_item_id uuid, p_variant_id uuid, p_quantity integer) returns integer language plpgsql security definer set search_path = '' as $$
declare v_remaining integer := greatest(0, p_quantity); v_take integer; v_reserved_total integer := 0; v_on_hand integer; v_reserved integer; v_expires timestamptz := timezone('utc', now()) + make_interval(mins => app_private.commerce_reservation_minutes()); r record;
begin
  if v_remaining = 0 then return 0; end if;
  for r in select ib.variant_id, ib.location_id, ib.available from public.inventory_balances ib join public.inventory_locations il on il.id = ib.location_id and il.is_active where ib.variant_id = p_variant_id and ib.available > 0 order by ib.available desc, il.code for update of ib loop
    exit when v_remaining <= 0; v_take := least(v_remaining, r.available);
    update public.inventory_balances ib set reserved = ib.reserved + v_take, updated_at = timezone('utc', now()) where ib.variant_id = r.variant_id and ib.location_id = r.location_id returning ib.on_hand, ib.reserved into v_on_hand, v_reserved;
    insert into public.inventory_ledger(variant_id, location_id, event_type, delta_reserved, balance_on_hand, balance_reserved, reference_type, reference_id, note, actor_user_id)
    values (p_variant_id, r.location_id, 'reservation', v_take, v_on_hand, v_reserved, 'cart_item', p_cart_item_id, 'Active cart reservation', (select auth.uid()));
    insert into public.inventory_reservations(cart_id, cart_item_id, variant_id, location_id, quantity, status, expires_at)
    values (p_cart_id, p_cart_item_id, p_variant_id, r.location_id, v_take, 'active', v_expires)
    on conflict (cart_item_id, location_id) where status = 'active' do update set quantity = public.inventory_reservations.quantity + excluded.quantity, expires_at = excluded.expires_at, updated_at = timezone('utc', now());
    v_remaining := v_remaining - v_take; v_reserved_total := v_reserved_total + v_take;
  end loop;
  if v_remaining > 0 then raise exception using errcode = 'P0001', message = 'insufficient_stock'; end if;
  return v_reserved_total;
end; $$;

create or replace function app_private.commerce_set_cart_quantity(p_cart_id uuid, p_variant_id uuid, p_quantity integer) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_item_id uuid; v_existing_quantity integer := 0; v_reserved_quantity integer := 0; v_track_inventory boolean; v_gap integer; v_expiry timestamptz := timezone('utc', now()) + make_interval(days => app_private.commerce_cart_expiry_days());
begin
  if p_quantity < 0 or p_quantity > 99 then raise exception using errcode = '22023', message = 'invalid_quantity'; end if;
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

create or replace function app_private.release_expired_inventory_reservations() returns integer language plpgsql security definer set search_path = '' as $$
declare v_count integer := 0; r record;
begin
  for r in select distinct ir.cart_item_id from public.inventory_reservations ir where ir.status = 'active' and ir.expires_at <= timezone('utc', now()) loop
    perform app_private.commerce_release_item_reservations(r.cart_item_id, 999, 'Cart reservation expired', 'expired'); v_count := v_count + 1;
  end loop;
  for r in select c.id from public.carts c where c.status = 'active' and c.expires_at is not null and c.expires_at <= timezone('utc', now()) for update loop
    perform app_private.commerce_release_item_reservations(ci.id, 999, 'Cart expired', 'expired') from public.cart_items ci where ci.cart_id = r.id;
    update public.carts set status = 'expired', updated_at = timezone('utc', now()) where id = r.id;
  end loop;
  return v_count;
end; $$;

create or replace function app_private.commerce_claim_guest_cart(p_guest_token_hash text) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_customer_id uuid; v_guest_cart uuid; v_customer_cart uuid; v_existing_qty integer; v_desired integer; r record;
begin
  v_customer_id := app_private.commerce_customer_id(); if v_customer_id is null then return null; end if;
  if not app_private.commerce_valid_guest_hash(p_guest_token_hash) then return app_private.commerce_cart_id(null, true); end if;
  select id into v_guest_cart from public.carts where guest_token_hash = p_guest_token_hash and status = 'active' for update;
  select id into v_customer_cart from public.carts where customer_id = v_customer_id and status = 'active' order by updated_at desc limit 1 for update;
  if v_guest_cart is null then return coalesce(v_customer_cart, app_private.commerce_cart_id(null, true)); end if;
  if v_customer_cart is null then update public.carts set customer_id = v_customer_id, guest_token_hash = null, updated_at = timezone('utc', now()) where id = v_guest_cart; return v_guest_cart; end if;
  for r in select ci.id, ci.variant_id, ci.quantity from public.cart_items ci where ci.cart_id = v_guest_cart order by ci.created_at for update loop
    select coalesce(ci.quantity, 0) into v_existing_qty from public.cart_items ci where ci.cart_id = v_customer_cart and ci.variant_id = r.variant_id for update; v_existing_qty := coalesce(v_existing_qty, 0); v_desired := least(99, v_existing_qty + r.quantity);
    perform app_private.commerce_release_item_reservations(r.id, 999, 'Guest cart merged after sign-in', 'converted');
    perform app_private.commerce_set_cart_quantity(v_customer_cart, r.variant_id, v_desired); delete from public.cart_items where id = r.id;
  end loop;
  update public.carts set status = 'converted', converted_order_id = null, updated_at = timezone('utc', now()) where id = v_guest_cart;
  return v_customer_cart;
end; $$;

create or replace function app_private.commerce_discount_quote(p_cart_id uuid) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_discount public.discounts%rowtype; v_customer_id uuid; v_subtotal bigint := 0; v_total_qty integer := 0; v_eligible_subtotal bigint := 0; v_scope_rules boolean := false; v_conditions_ok boolean := true; v_discount_pkr bigint := 0; v_free_shipping boolean := false; v_zone_id uuid; r record;
begin
  select coalesce(sum(pv.price_pkr * ci.quantity),0)::bigint, coalesce(sum(ci.quantity),0)::integer into v_subtotal, v_total_qty from public.cart_items ci join public.product_variants pv on pv.id = ci.variant_id and pv.status = 'active' join public.products p on p.id = pv.product_id and p.status = 'active' and p.published_at is not null and p.published_at <= timezone('utc', now()) where ci.cart_id = p_cart_id;
  select d.* into v_discount from public.carts c join public.discounts d on d.id = c.discount_id where c.id = p_cart_id;
  if v_discount.id is null then return jsonb_build_object('valid', false, 'code', null, 'name', null, 'amount_pkr', 0, 'free_shipping', false, 'reason', null); end if;
  if not v_discount.is_active or (v_discount.starts_at is not null and v_discount.starts_at > timezone('utc', now())) or (v_discount.ends_at is not null and v_discount.ends_at <= timezone('utc', now())) or v_subtotal < v_discount.min_order_pkr then return jsonb_build_object('valid', false, 'code', v_discount.code::text, 'name', v_discount.name, 'amount_pkr', 0, 'free_shipping', false, 'reason', 'Discount is not currently eligible for this cart.'); end if;
  if v_discount.usage_limit is not null and (select count(*) from public.discount_redemptions dr where dr.discount_id = v_discount.id) >= v_discount.usage_limit then return jsonb_build_object('valid', false, 'code', v_discount.code::text, 'name', v_discount.name, 'amount_pkr', 0, 'free_shipping', false, 'reason', 'Discount usage limit has been reached.'); end if;
  v_customer_id := (select c.customer_id from public.carts c where c.id = p_cart_id);
  if v_customer_id is not null and v_discount.usage_limit_per_customer is not null and (select count(*) from public.discount_redemptions dr where dr.discount_id = v_discount.id and dr.customer_id = v_customer_id) >= v_discount.usage_limit_per_customer then return jsonb_build_object('valid', false, 'code', v_discount.code::text, 'name', v_discount.name, 'amount_pkr', 0, 'free_shipping', false, 'reason', 'Discount customer usage limit has been reached.'); end if;
  select sr.zone_id into v_zone_id from public.shipping_rules sr join public.shipping_zones sz on sz.id = sr.zone_id where sr.is_active and sz.is_active and (sr.starts_at is null or sr.starts_at <= timezone('utc', now())) and (sr.ends_at is null or sr.ends_at > timezone('utc', now())) order by sz.is_nationwide desc, sr.created_at desc limit 1;
  for r in select dr.rule_type, dr.rule_config from public.discount_rules dr where dr.discount_id = v_discount.id loop
    if r.rule_type in ('product','category','collection') then v_scope_rules := true;
    elsif r.rule_type = 'minimum_quantity' then if v_total_qty < coalesce(nullif(r.rule_config->>'minimum_quantity','')::integer, 1) then v_conditions_ok := false; end if;
    elsif r.rule_type = 'first_order' then if v_customer_id is null or exists(select 1 from public.orders o where o.customer_id = v_customer_id) then v_conditions_ok := false; end if;
    elsif r.rule_type = 'customer' then if v_customer_id is null or not (coalesce(r.rule_config->'customer_ids','[]'::jsonb) ? v_customer_id::text) then v_conditions_ok := false; end if;
    elsif r.rule_type = 'shipping_zone' then if v_zone_id is null or not (coalesce(r.rule_config->'zone_ids','[]'::jsonb) ? v_zone_id::text) then v_conditions_ok := false; end if; end if;
  end loop;
  if not v_conditions_ok then return jsonb_build_object('valid', false, 'code', v_discount.code::text, 'name', v_discount.name, 'amount_pkr', 0, 'free_shipping', false, 'reason', 'Discount conditions are not met.'); end if;
  select coalesce(sum(pv.price_pkr * ci.quantity),0)::bigint into v_eligible_subtotal from public.cart_items ci join public.product_variants pv on pv.id = ci.variant_id join public.products p on p.id = pv.product_id where ci.cart_id = p_cart_id and (not v_scope_rules or exists (select 1 from public.discount_rules dr where dr.discount_id = v_discount.id and ((dr.rule_type = 'product' and coalesce(dr.rule_config->'product_ids','[]'::jsonb) ? p.id::text) or (dr.rule_type = 'category' and exists (select 1 from public.product_categories pc where pc.product_id = p.id and coalesce(dr.rule_config->'category_ids','[]'::jsonb) ? pc.category_id::text)) or (dr.rule_type = 'collection' and exists (select 1 from public.collection_products cp where cp.product_id = p.id and coalesce(dr.rule_config->'collection_ids','[]'::jsonb) ? cp.collection_id::text)))));
  if v_eligible_subtotal <= 0 then return jsonb_build_object('valid', false, 'code', v_discount.code::text, 'name', v_discount.name, 'amount_pkr', 0, 'free_shipping', false, 'reason', 'Discount does not apply to these items.'); end if;
  if v_discount.discount_type = 'percentage' then v_discount_pkr := floor(v_eligible_subtotal * v_discount.percentage_bps / 10000.0)::bigint; if v_discount.max_discount_pkr is not null then v_discount_pkr := least(v_discount_pkr, v_discount.max_discount_pkr); end if;
  elsif v_discount.discount_type = 'fixed_amount' then v_discount_pkr := least(v_eligible_subtotal, v_discount.fixed_amount_pkr);
  elsif v_discount.discount_type = 'free_shipping' then v_free_shipping := true; end if;
  return jsonb_build_object('valid', true, 'code', v_discount.code::text, 'name', v_discount.name, 'amount_pkr', v_discount_pkr, 'free_shipping', v_free_shipping, 'reason', null);
end; $$;

create or replace function public.commerce_cart_snapshot(p_guest_token_hash text default null) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_cart_id uuid; v_auth boolean := (select auth.uid()) is not null; v_lines jsonb := '[]'::jsonb; v_subtotal bigint := 0; v_discount jsonb; v_discount_pkr bigint := 0; v_shipping bigint := 0; v_total bigint := 0; v_item_count integer := 0; v_shipping_rule public.shipping_rules%rowtype; v_cod_enabled boolean := false;
begin
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
  v_discount := app_private.commerce_discount_quote(v_cart_id); if coalesce((v_discount->>'valid')::boolean,false) then v_discount_pkr := coalesce((v_discount->>'amount_pkr')::bigint,0); end if;
  select sr.* into v_shipping_rule from public.shipping_rules sr join public.shipping_zones sz on sz.id=sr.zone_id where sr.is_active and sz.is_active and (sr.starts_at is null or sr.starts_at <= timezone('utc', now())) and (sr.ends_at is null or sr.ends_at > timezone('utc', now())) order by sz.is_nationwide desc, sr.created_at desc limit 1;
  if v_shipping_rule.id is not null and v_item_count > 0 then v_shipping := v_shipping_rule.flat_fee_pkr; if coalesce((v_discount->>'free_shipping')::boolean,false) then v_shipping := 0; elsif v_shipping_rule.free_shipping_threshold_pkr is not null and greatest(0,v_subtotal-v_discount_pkr) >= v_shipping_rule.free_shipping_threshold_pkr then v_shipping := 0; end if; end if;
  v_total := greatest(0,v_subtotal-v_discount_pkr)+v_shipping; select coalesce((value #>> '{}')::boolean,false) into v_cod_enabled from public.system_settings where key='payments.cod_enabled';
  return jsonb_build_object('cart_id', v_cart_id,'authenticated', v_auth,'lines', v_lines,'item_count', v_item_count,'reservation_minutes', app_private.commerce_reservation_minutes(),'quote', jsonb_build_object('subtotal_pkr', v_subtotal,'discount_pkr', v_discount_pkr,'shipping_pkr', v_shipping,'total_pkr', v_total,'discount_code', v_discount->>'code','discount_name', v_discount->>'name','discount_error', case when (v_discount->>'code') is not null and not coalesce((v_discount->>'valid')::boolean,false) then v_discount->>'reason' else null end,'cod_eligible', v_cod_enabled and (v_shipping_rule.id is null or (v_total >= v_shipping_rule.cod_min_order_pkr and (v_shipping_rule.cod_max_order_pkr is null or v_total <= v_shipping_rule.cod_max_order_pkr))),'estimated_days_min', coalesce(v_shipping_rule.estimated_days_min,2),'estimated_days_max', coalesce(v_shipping_rule.estimated_days_max,7),'free_shipping_threshold_pkr', v_shipping_rule.free_shipping_threshold_pkr,'flat_fee_pkr', coalesce(v_shipping_rule.flat_fee_pkr,0)));
end; $$;

create or replace function public.commerce_cart_set_quantity(p_guest_token_hash text, p_variant_id uuid, p_quantity integer) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_cart_id uuid; begin perform app_private.release_expired_inventory_reservations(); if (select auth.uid()) is not null then v_cart_id := app_private.commerce_claim_guest_cart(p_guest_token_hash); else if not app_private.commerce_valid_guest_hash(p_guest_token_hash) then raise exception using errcode='22023',message='guest_cart_token_required'; end if; v_cart_id := app_private.commerce_cart_id(p_guest_token_hash, true); end if; perform app_private.commerce_set_cart_quantity(v_cart_id,p_variant_id,p_quantity); return public.commerce_cart_snapshot(p_guest_token_hash); end; $$;
create or replace function public.commerce_cart_add(p_guest_token_hash text, p_variant_id uuid, p_quantity integer) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_cart_id uuid; v_existing integer; begin if p_quantity < 1 or p_quantity > 99 then raise exception using errcode='22023',message='invalid_quantity'; end if; perform app_private.release_expired_inventory_reservations(); if (select auth.uid()) is not null then v_cart_id := app_private.commerce_claim_guest_cart(p_guest_token_hash); else if not app_private.commerce_valid_guest_hash(p_guest_token_hash) then raise exception using errcode='22023',message='guest_cart_token_required'; end if; v_cart_id := app_private.commerce_cart_id(p_guest_token_hash,true); end if; select coalesce(quantity,0) into v_existing from public.cart_items where cart_id=v_cart_id and variant_id=p_variant_id for update; v_existing := coalesce(v_existing,0); perform app_private.commerce_set_cart_quantity(v_cart_id,p_variant_id,least(99,v_existing+p_quantity)); return public.commerce_cart_snapshot(p_guest_token_hash); end; $$;
create or replace function public.commerce_cart_merge_lines(p_guest_token_hash text, p_lines jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_cart_id uuid; v_variant uuid; v_qty integer; v_existing integer; r record; begin if jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) > 30 then raise exception using errcode='22023',message='invalid_cart_lines'; end if; perform app_private.release_expired_inventory_reservations(); if (select auth.uid()) is not null then v_cart_id := app_private.commerce_claim_guest_cart(p_guest_token_hash); else if not app_private.commerce_valid_guest_hash(p_guest_token_hash) then raise exception using errcode='22023',message='guest_cart_token_required'; end if; v_cart_id := app_private.commerce_cart_id(p_guest_token_hash,true); end if; for r in select value from jsonb_array_elements(p_lines) loop begin v_variant := (r.value->>'variantId')::uuid; v_qty := greatest(1,least(99,(r.value->>'quantity')::integer)); exception when others then raise exception using errcode='22023',message='invalid_cart_line'; end; select coalesce(quantity,0) into v_existing from public.cart_items where cart_id=v_cart_id and variant_id=v_variant for update; v_existing := coalesce(v_existing,0); perform app_private.commerce_set_cart_quantity(v_cart_id,v_variant,least(99,v_existing+v_qty)); end loop; return public.commerce_cart_snapshot(p_guest_token_hash); end; $$;
create or replace function public.commerce_cart_apply_discount(p_guest_token_hash text, p_code text) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_cart_id uuid; v_discount_id uuid; v_quote jsonb; begin if (select auth.uid()) is not null then v_cart_id := app_private.commerce_claim_guest_cart(p_guest_token_hash); else v_cart_id := app_private.commerce_cart_id(p_guest_token_hash,false); end if; if v_cart_id is null then return public.commerce_cart_snapshot(p_guest_token_hash); end if; if nullif(trim(p_code),'') is null then update public.carts set discount_id=null,updated_at=timezone('utc',now()) where id=v_cart_id; return public.commerce_cart_snapshot(p_guest_token_hash); end if; select id into v_discount_id from public.discounts where code=trim(p_code)::extensions.citext limit 1; if v_discount_id is null then raise exception using errcode='P0001',message='discount_not_found'; end if; update public.carts set discount_id=v_discount_id,updated_at=timezone('utc',now()) where id=v_cart_id; v_quote := app_private.commerce_discount_quote(v_cart_id); if not coalesce((v_quote->>'valid')::boolean,false) then update public.carts set discount_id=null,updated_at=timezone('utc',now()) where id=v_cart_id; raise exception using errcode='P0001',message=coalesce(v_quote->>'reason','discount_not_eligible'); end if; return public.commerce_cart_snapshot(p_guest_token_hash); end; $$;

create or replace function public.commerce_wishlist_snapshot() returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_customer uuid; v_wishlist uuid; v_lines jsonb; begin v_customer := app_private.commerce_customer_id(); if v_customer is null then raise exception using errcode='42501',message='authentication_required'; end if; select id into v_wishlist from public.wishlists where customer_id=v_customer and is_default order by created_at limit 1; if v_wishlist is null then return jsonb_build_object('authenticated',true,'lines','[]'::jsonb); end if; select coalesce(jsonb_agg(jsonb_build_object('variant_id',pv.id,'product_slug',p.slug,'product_name',p.name,'variant_title',pv.title,'unit_price_pkr',pv.price_pkr,'media_path',pm.storage_path) order by wi.created_at desc),'[]'::jsonb) into v_lines from public.wishlist_items wi join public.product_variants pv on pv.id=wi.variant_id and pv.status='active' join public.products p on p.id=pv.product_id and p.status='active' and p.published_at is not null and p.published_at <= timezone('utc',now()) left join lateral (select pm2.storage_path from public.product_media pm2 where pm2.product_id=p.id and (pm2.variant_id is null or pm2.variant_id=pv.id) and pm2.media_type='image' order by (pm2.variant_id=pv.id) desc,pm2.is_primary desc,pm2.position limit 1) pm on true where wi.wishlist_id=v_wishlist; return jsonb_build_object('authenticated',true,'lines',v_lines); end; $$;
create or replace function public.commerce_wishlist_set(p_variant_id uuid, p_saved boolean) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_customer uuid; v_wishlist uuid; begin v_customer := app_private.commerce_customer_id(); if v_customer is null then raise exception using errcode='42501',message='authentication_required'; end if; if p_saved then if not exists(select 1 from public.product_variants pv join public.products p on p.id=pv.product_id where pv.id=p_variant_id and pv.status='active' and p.status='active' and p.published_at is not null and p.published_at <= timezone('utc',now())) then raise exception using errcode='P0001',message='variant_unavailable'; end if; select id into v_wishlist from public.wishlists where customer_id=v_customer and is_default order by created_at limit 1 for update; if v_wishlist is null then insert into public.wishlists(customer_id,name,is_default) values(v_customer,'Saved',true) returning id into v_wishlist; end if; insert into public.wishlist_items(wishlist_id,variant_id) values(v_wishlist,p_variant_id) on conflict do nothing; else select id into v_wishlist from public.wishlists where customer_id=v_customer and is_default order by created_at limit 1; if v_wishlist is not null then delete from public.wishlist_items where wishlist_id=v_wishlist and variant_id=p_variant_id; end if; end if; return public.commerce_wishlist_snapshot(); end; $$;
create or replace function public.commerce_wishlist_merge(p_variant_ids uuid[]) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_id uuid; begin if coalesce(array_length(p_variant_ids,1),0)>50 then raise exception using errcode='22023',message='too_many_wishlist_items'; end if; foreach v_id in array coalesce(p_variant_ids,'{}'::uuid[]) loop perform public.commerce_wishlist_set(v_id,true); end loop; return public.commerce_wishlist_snapshot(); end; $$;

revoke all on function public.commerce_cart_snapshot(text) from public; revoke all on function public.commerce_cart_set_quantity(text,uuid,integer) from public; revoke all on function public.commerce_cart_add(text,uuid,integer) from public; revoke all on function public.commerce_cart_merge_lines(text,jsonb) from public; revoke all on function public.commerce_cart_apply_discount(text,text) from public; revoke all on function public.commerce_wishlist_snapshot() from public; revoke all on function public.commerce_wishlist_set(uuid,boolean) from public; revoke all on function public.commerce_wishlist_merge(uuid[]) from public;
grant execute on function public.commerce_cart_snapshot(text) to anon,authenticated; grant execute on function public.commerce_cart_set_quantity(text,uuid,integer) to anon,authenticated; grant execute on function public.commerce_cart_add(text,uuid,integer) to anon,authenticated; grant execute on function public.commerce_cart_merge_lines(text,jsonb) to anon,authenticated; grant execute on function public.commerce_cart_apply_discount(text,text) to anon,authenticated; grant execute on function public.commerce_wishlist_snapshot() to authenticated; grant execute on function public.commerce_wishlist_set(uuid,boolean) to authenticated; grant execute on function public.commerce_wishlist_merge(uuid[]) to authenticated;
revoke all on function app_private.commerce_reservation_minutes() from public; revoke all on function app_private.commerce_cart_expiry_days() from public; revoke all on function app_private.commerce_customer_id() from public; revoke all on function app_private.commerce_valid_guest_hash(text) from public; revoke all on function app_private.commerce_cart_id(text,boolean) from public; revoke all on function app_private.commerce_release_item_reservations(uuid,integer,text,text) from public; revoke all on function app_private.commerce_reserve_item(uuid,uuid,uuid,integer) from public; revoke all on function app_private.commerce_set_cart_quantity(uuid,uuid,integer) from public; revoke all on function app_private.release_expired_inventory_reservations() from public; revoke all on function app_private.commerce_claim_guest_cart(text) from public; revoke all on function app_private.commerce_discount_quote(uuid) from public;

create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres; grant all privileges on all tables in schema cron to postgres;
do $$ declare v_job bigint; begin select jobid into v_job from cron.job where jobname='dwellune-release-expired-cart-reservations' limit 1; if v_job is not null then perform cron.unschedule(v_job); end if; perform cron.schedule('dwellune-release-expired-cart-reservations','*/5 * * * *','select app_private.release_expired_inventory_reservations();'); end $$;
comment on table public.inventory_reservations is 'Phase 6 cart-level inventory holds. Active holds expire after the configured reservation window and are released atomically into inventory_balances and inventory_ledger.';
comment on function public.commerce_cart_snapshot(text) is 'Returns a server-authoritative cart quote. Guest access is isolated by an unguessable SHA-256 token hash; authenticated access resolves ownership from auth.uid().';