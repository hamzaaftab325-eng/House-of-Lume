-- Order creation remains closed until operator and transactional-email configuration pass release gates.
create extension if not exists pg_net with schema extensions;
insert into public.system_settings(key,value,is_public,description) values
 ('checkout.orders_enabled','false',true,'Enable only after staff, transactional email and checkout acceptance are verified.'),
 ('checkout.max_orders_per_day','5',false,'Maximum COD orders per customer, guest identity and normalized phone in 24 hours.'),
 ('cod.verification_required','true',true,'New COD orders await admin verification by default.') on conflict(key) do nothing;

create table app_private.checkout_receipts (
 order_id uuid primary key references public.orders(id) on delete cascade,
 customer_id uuid references public.customers(id) on delete set null,
 guest_hash text,
 request_hash text not null,
 created_at timestamptz not null default now(),
 check(customer_id is not null or guest_hash ~ '^[a-f0-9]{64}$')
);
alter table app_private.checkout_receipts enable row level security;
revoke all on app_private.checkout_receipts from public,anon,authenticated;
create index checkout_receipts_guest_idx on app_private.checkout_receipts(guest_hash,created_at) where guest_hash is not null;
create index checkout_receipts_customer_idx on app_private.checkout_receipts(customer_id,created_at) where customer_id is not null;

create table public.order_inventory_reservations (
 id uuid primary key default gen_random_uuid(),
 order_id uuid not null references public.orders(id) on delete restrict,
 order_item_id uuid not null references public.order_items(id) on delete restrict,
 variant_id uuid not null references public.product_variants(id) on delete restrict,
 location_id uuid not null references public.inventory_locations(id) on delete restrict,
 source_cart_reservation_id uuid not null,
 quantity integer not null check(quantity>0),
 status text not null default 'active' check(status in ('active','released','consumed')),
 created_at timestamptz not null default now(),
 released_at timestamptz,
 unique(source_cart_reservation_id)
);
alter table public.order_inventory_reservations enable row level security;
revoke all on public.order_inventory_reservations from public,anon,authenticated;
grant select on public.order_inventory_reservations to authenticated;
grant all on public.order_inventory_reservations to service_role;
create policy order_reservations_staff_read on public.order_inventory_reservations for select to authenticated using((select app_private.is_super_admin()));
create index order_reservations_order_idx on public.order_inventory_reservations(order_id);
create index order_reservations_item_idx on public.order_inventory_reservations(order_item_id);
create index order_reservations_variant_idx on public.order_inventory_reservations(variant_id);
create index order_reservations_location_idx on public.order_inventory_reservations(location_id);

create table app_private.order_email_outbox (
 id uuid primary key default gen_random_uuid(),
 order_id uuid not null unique references public.orders(id) on delete cascade,
 notification_id uuid references public.notifications(id) on delete set null,
 payload jsonb not null,
 template_version text not null default 'order-placed-v1',
 status text not null default 'pending' check(status in ('pending','sending','sent','failed')),
 attempt_count int not null default 0,
 next_attempt_at timestamptz not null default now(),
 request_id bigint,
 provider_message_id text,
 last_error_code text,
 first_attempt_at timestamptz,
 created_at timestamptz not null default now(),
 sent_at timestamptz
);
alter table app_private.order_email_outbox enable row level security;
revoke all on app_private.order_email_outbox from public,anon,authenticated;
create index order_email_outbox_pending_idx on app_private.order_email_outbox(next_attempt_at) where status in ('pending','sending');
create index order_email_notification_idx on app_private.order_email_outbox(notification_id) where notification_id is not null;

create function app_private.checkout_release_ready() returns boolean language sql stable security definer set search_path='' as $$
 select coalesce((select (value #>> '{}')::boolean from public.system_settings where key='checkout.orders_enabled'),false)
 and exists(select 1 from public.staff_profiles where is_active and role_slug='super_admin')
 and exists(select 1 from vault.decrypted_secrets where name='dwellune_resend_api_key' and length(decrypted_secret)>20)
 and exists(select 1 from vault.decrypted_secrets where name='dwellune_order_email_from' and decrypted_secret ~ '^[^[:space:]<>@]+@[^[:space:]<>@]+\.[^[:space:]<>@]+$');
$$;
revoke all on function app_private.checkout_release_ready() from public;
create function public.checkout_release_ready() returns boolean language sql stable security invoker set search_path='' as $$ select app_private.checkout_release_ready(); $$;
grant execute on function app_private.checkout_release_ready() to anon,authenticated;
revoke all on function public.checkout_release_ready() from public;
grant execute on function public.checkout_release_ready() to anon,authenticated;
create or replace function app_private.checkout_discount_quote(p_cart_id uuid, p_zone_id uuid) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_discount public.discounts%rowtype; v_customer_id uuid; v_subtotal bigint := 0; v_total_qty integer := 0; v_eligible_subtotal bigint := 0; v_scope_rules boolean := false; v_conditions_ok boolean := true; v_discount_pkr bigint := 0; v_free_shipping boolean := false; v_zone_id uuid; r record;
begin
  select coalesce(sum(pv.price_pkr * ci.quantity),0)::bigint, coalesce(sum(ci.quantity),0)::integer into v_subtotal, v_total_qty from public.cart_items ci join public.product_variants pv on pv.id = ci.variant_id and pv.status = 'active' join public.products p on p.id = pv.product_id and p.status = 'active' and p.published_at is not null and p.published_at <= timezone('utc', now()) where ci.cart_id = p_cart_id;
  select d.* into v_discount from public.carts c join public.discounts d on d.id = c.discount_id where c.id = p_cart_id;
  if v_discount.id is null then return jsonb_build_object('valid', false, 'code', null, 'name', null, 'amount_pkr', 0, 'free_shipping', false, 'reason', null); end if;
  if not v_discount.is_active or (v_discount.starts_at is not null and v_discount.starts_at > timezone('utc', now())) or (v_discount.ends_at is not null and v_discount.ends_at <= timezone('utc', now())) or v_subtotal < v_discount.min_order_pkr then return jsonb_build_object('valid', false, 'code', v_discount.code::text, 'name', v_discount.name, 'amount_pkr', 0, 'free_shipping', false, 'reason', 'Discount is not currently eligible for this cart.'); end if;
  if v_discount.usage_limit is not null and (select count(*) from public.discount_redemptions dr where dr.discount_id = v_discount.id) >= v_discount.usage_limit then return jsonb_build_object('valid', false, 'code', v_discount.code::text, 'name', v_discount.name, 'amount_pkr', 0, 'free_shipping', false, 'reason', 'Discount usage limit has been reached.'); end if;
  v_customer_id := (select c.customer_id from public.carts c where c.id = p_cart_id);
  if v_customer_id is not null and v_discount.usage_limit_per_customer is not null and (select count(*) from public.discount_redemptions dr where dr.discount_id = v_discount.id and dr.customer_id = v_customer_id) >= v_discount.usage_limit_per_customer then return jsonb_build_object('valid', false, 'code', v_discount.code::text, 'name', v_discount.name, 'amount_pkr', 0, 'free_shipping', false, 'reason', 'Discount customer usage limit has been reached.'); end if;
  v_zone_id := p_zone_id;
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
-- Part 1 only: derive an address-specific quote. No orders or notification records are created.
create or replace function app_private.checkout_quote(p_guest_token_hash text, p_address jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
 v_cart_id uuid; v_customer uuid; v_cart jsonb; v_rule public.shipping_rules%rowtype;
 v_zone public.shipping_zones%rowtype; v_discount jsonb; v_shipping bigint;
 v_total bigint; v_net bigint; v_count int; v_revision text; v_expires timestamptz;
 v_city text; v_province text; v_cod boolean; v_guest boolean;
begin
 perform app_private.commerce_lock();
 if p_address is null or jsonb_typeof(p_address)<>'object' or p_address->>'country'<>'PK'
    or p_address->>'country' is null or jsonb_typeof(p_address->'city') is distinct from 'string'
    or length(trim(p_address->>'city')) not between 2 and 80
    or coalesce(p_address->>'province','') not in ('Punjab','Sindh','Khyber Pakhtunkhwa','Balochistan','Islamabad Capital Territory','Gilgit-Baltistan','Azad Jammu and Kashmir')
 then raise exception 'invalid_delivery_address'; end if;
 v_city:=lower(trim(p_address->>'city')); v_province:=lower(p_address->>'province');
 if auth.uid() is not null then
  v_customer:=app_private.commerce_customer_id();
  if v_customer is null then raise exception 'authentication_required'; end if;
  v_cart_id:=app_private.commerce_claim_guest_cart(p_guest_token_hash);
 else
  select coalesce((value #>> '{}')::boolean,false) into v_guest from public.system_settings where key='checkout.guest_enabled';
  if not coalesce(v_guest,false) then raise exception 'guest_checkout_disabled'; end if;
  if not app_private.commerce_valid_guest_hash(p_guest_token_hash) then raise exception 'guest_cart_token_required'; end if;
  v_cart_id:=app_private.commerce_cart_id(p_guest_token_hash,false);
 end if;
 if v_cart_id is null then raise exception 'empty_cart'; end if;
 select count(*) into v_count from public.cart_items where cart_id=v_cart_id;
 v_cart:=app_private.commerce_cart_snapshot(p_guest_token_hash);
 if jsonb_array_length(v_cart->'lines')<>v_count then raise exception 'variant_unavailable'; end if;
 if v_count=0 then raise exception 'empty_cart'; end if;
 if v_count>30 or (v_cart->>'item_count')::int>2970 then raise exception 'checkout_item_limit'; end if;
 if exists(select 1 from jsonb_array_elements(v_cart->'lines') l where l->>'stock_state'='unavailable' or (l->>'quantity')::int>(l->>'max_quantity')::int) then raise exception 'insufficient_stock'; end if;

 select sr.* into v_rule -- select the exact configured rule by address specificity
 from public.shipping_rules sr join public.shipping_zones sz on sz.id=sr.zone_id
 where sr.is_active and sz.is_active and sz.country_code='PK'
 and (sr.starts_at is null or sr.starts_at<=now()) and (sr.ends_at is null or sr.ends_at>now())
 and (sz.is_nationwide or ((cardinality(sz.cities)>0 or cardinality(sz.provinces)>0)
   and (cardinality(sz.cities)=0 or exists(select 1 from unnest(sz.cities) c where lower(trim(c))=v_city))
   and (cardinality(sz.provinces)=0 or exists(select 1 from unnest(sz.provinces) p where lower(trim(p))=v_province))))
 order by case when sz.is_nationwide then 0 when cardinality(sz.cities)>0 then 2 else 1 end desc,sr.created_at desc,sr.id
 limit 1;
 if v_rule.id is null then raise exception 'delivery_area_unsupported'; end if;
 select * into v_zone from public.shipping_zones where id=v_rule.zone_id;
 v_discount:=app_private.checkout_discount_quote(v_cart_id,v_rule.zone_id);
 if v_discount->>'code' is not null and not coalesce((v_discount->>'valid')::boolean,false) then raise exception 'discount_not_eligible'; end if;
 v_cart:=jsonb_set(v_cart,'{quote}',(v_cart->'quote')||jsonb_build_object('discount_pkr',coalesce((v_discount->>'amount_pkr')::bigint,0),'discount_code',v_discount->>'code','discount_name',v_discount->>'name','discount_error',null));
 v_net:=greatest(0,(v_cart->'quote'->>'subtotal_pkr')::bigint-(v_cart->'quote'->>'discount_pkr')::bigint);
 v_shipping:=v_rule.flat_fee_pkr;
 if coalesce((v_discount->>'free_shipping')::boolean,false) or (v_rule.free_shipping_threshold_pkr is not null and v_net>=v_rule.free_shipping_threshold_pkr) then v_shipping:=0; end if;
 -- Configured remote surcharge remains separate from a waived base delivery fee.
 v_shipping:=v_shipping+v_rule.remote_surcharge_pkr;
 v_total:=v_net+v_shipping;
 select coalesce((value #>> '{}')::boolean,false) into v_cod from public.system_settings where key='payments.cod_enabled';
 if not coalesce(v_cod,false) or v_total<v_rule.cod_min_order_pkr or (v_rule.cod_max_order_pkr is not null and v_total>v_rule.cod_max_order_pkr) then raise exception 'cod_not_eligible'; end if;
 v_cart:=jsonb_set(v_cart,'{quote}',(v_cart->'quote')||jsonb_build_object('shipping_pkr',v_shipping,'total_pkr',v_total,'cod_eligible',true,'flat_fee_pkr',v_rule.flat_fee_pkr,'free_shipping_threshold_pkr',v_rule.free_shipping_threshold_pkr,'estimated_days_min',v_rule.estimated_days_min,'estimated_days_max',v_rule.estimated_days_max));
 select least(now()+interval '5 minutes',coalesce(min((l->>'reservation_expires_at')::timestamptz),now()+interval '5 minutes')) into v_expires from jsonb_array_elements(v_cart->'lines') l;
 v_revision:=encode(extensions.digest(convert_to(jsonb_build_object('cart',v_cart,'address',p_address,'shipping_rule',to_jsonb(v_rule))::text,'UTF8'),'sha256'),'hex');
 return jsonb_build_object('cart',v_cart,'revision',v_revision,'quoted_at',now(),'expires_at',v_expires,
  'delivery',jsonb_build_object('rule_id',v_rule.id,'name',v_rule.name,'zone',v_zone.name,'surcharge_pkr',v_rule.remote_surcharge_pkr,'cod_min_pkr',v_rule.cod_min_order_pkr,'cod_max_pkr',v_rule.cod_max_order_pkr),
  'needs_stock_revalidation',exists(select 1 from jsonb_array_elements(v_cart->'lines') l where l->>'stock_state'='revalidation_required'),
  'contains_test_product',exists(select 1 from public.cart_items ci join public.product_variants pv on pv.id=ci.variant_id join public.products p on p.id=pv.product_id where ci.cart_id=v_cart_id and p.specifications->>'test_product'='true'));
end; $$;
revoke all on function app_private.checkout_discount_quote(uuid,uuid) from public,anon,authenticated;

create function app_private.checkout_confirmation(p_order_id uuid,p_guest_hash text) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_customer uuid; v_order public.orders%rowtype; v_receipt app_private.checkout_receipts%rowtype; v_lines jsonb;
begin
 if auth.uid() is not null then v_customer:=app_private.commerce_customer_id(); if v_customer is null then raise exception 'authentication_required'; end if; end if;
 select * into v_receipt from app_private.checkout_receipts where order_id=p_order_id;
 if v_receipt.order_id is null or not ((v_customer is not null and v_receipt.customer_id=v_customer) or (auth.uid() is null and app_private.commerce_valid_guest_hash(p_guest_hash) and v_receipt.guest_hash=p_guest_hash)) then raise exception 'order_unavailable'; end if;
 select * into v_order from public.orders where id=p_order_id;
 select coalesce(jsonb_agg(jsonb_build_object('name',product_name,'variant',variant_name,'quantity',quantity,'unit_price_pkr',unit_price_pkr,'line_total_pkr',line_total_pkr) order by created_at,id),'[]') into v_lines from public.order_items where order_id=p_order_id;
 return jsonb_build_object('id',v_order.id,'order_number',v_order.order_number,'authenticated',v_customer is not null,'status',v_order.status,'verification_status',v_order.verification_status,'payment_method','cash_on_delivery','placed_at',v_order.placed_at,'subtotal_pkr',v_order.subtotal_pkr,'discount_pkr',v_order.discount_pkr,'shipping_pkr',v_order.shipping_pkr,'tax_pkr',v_order.tax_pkr,'total_pkr',v_order.total_pkr,'lines',v_lines,'email_status',(select status from app_private.order_email_outbox where order_id=p_order_id));
end; $$;
revoke all on function app_private.checkout_confirmation(uuid,text) from public;
grant execute on function app_private.checkout_confirmation(uuid,text) to anon,authenticated;
create function public.checkout_confirmation(p_order_id uuid,p_guest_hash text) returns jsonb language sql security invoker set search_path='' as $$ select app_private.checkout_confirmation(p_order_id,p_guest_hash); $$;
revoke all on function public.checkout_confirmation(uuid,text) from public;
grant execute on function public.checkout_confirmation(uuid,text) to anon,authenticated;

create function app_private.checkout_place_order(p_guest_hash text,p_key uuid,p_revision text,p_input jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_customer uuid; v_scope text; v_key text; v_hash text; v_existing public.orders%rowtype; v_cart uuid; v_quote jsonb; v_totals jsonb; v_address jsonb; v_order uuid; v_item uuid; v_discount uuid; v_notification uuid; v_required boolean; v_limit int; v_phone text; v_email text; v_text text; r record; h record;
begin
 perform app_private.commerce_lock();
 if p_key is null or p_revision is null or p_revision !~ '^[a-f0-9]{64}$' or p_input is null or jsonb_typeof(p_input)<>'object' then raise exception 'invalid_checkout'; end if;
 if auth.uid() is not null then v_customer:=app_private.commerce_customer_id(); if v_customer is null then raise exception 'authentication_required'; end if; v_scope:='customer:'||v_customer;
 else if not app_private.commerce_valid_guest_hash(p_guest_hash) then raise exception 'guest_cart_token_required'; end if; v_scope:='guest:'||p_guest_hash; end if;
 v_key:=encode(extensions.digest(v_scope||':'||p_key::text,'sha256'),'hex');
 v_hash:=encode(extensions.digest(p_input::text||':'||p_revision,'sha256'),'hex');
 select * into v_existing from public.orders where idempotency_key=v_key;
 if v_existing.id is not null then
  if not exists(select 1 from app_private.checkout_receipts where order_id=v_existing.id and request_hash=v_hash) then raise exception 'idempotency_conflict'; end if;
  return app_private.checkout_confirmation(v_existing.id,p_guest_hash);
 end if;
 if not app_private.checkout_release_ready() then raise exception 'checkout_not_open'; end if;
 if exists(select 1 from jsonb_object_keys(p_input) k where k not in ('name','email','phone','address','savedAddressId','notes','terms'))
 or length(trim(coalesce(p_input->>'name',''))) not between 2 and 100 or length(coalesce(p_input->>'notes',''))>1000 or p_input->'terms' is distinct from 'true'::jsonb then raise exception 'invalid_checkout'; end if;
 v_phone:=regexp_replace(p_input->>'phone','[ ()-]','','g');
 if v_phone is null or v_phone !~ '^(\+92|0092|92|0)3[0-9]{9}$' then raise exception 'invalid_checkout'; end if;
 v_phone:='+92'||right(v_phone,10);
 v_email:=trim(p_input->>'email');
 if v_customer is not null then select email::text into v_email from auth.users where id=auth.uid(); end if;
 if v_email is null or length(v_email)>254 or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'invalid_checkout'; end if;
 v_address:=p_input->'address';
 if p_input->>'savedAddressId' is not null then
  select jsonb_build_object('line1',address_line1,'line2',coalesce(address_line2,''),'city',city,'province',province,'postalCode',coalesce(postal_code,''),'country','PK') into v_address from public.customer_addresses where id=(p_input->>'savedAddressId')::uuid and customer_id=v_customer for share;
  if v_address is null then raise exception 'saved_address_unavailable'; end if;
 end if;
 if length(trim(coalesce(v_address->>'line1',''))) not between 5 and 200 or length(coalesce(v_address->>'line2',''))>200 or coalesce(v_address->>'postalCode','') !~ '^([0-9]{5})?$' then raise exception 'invalid_delivery_address'; end if;
 v_limit:=greatest(1,least(20,coalesce((select (value #>> '{}')::int from public.system_settings where key='checkout.max_orders_per_day'),5)));
 if (select count(*) from public.orders where placed_at>now()-interval '24 hours' and contact_phone=v_phone)>=v_limit
 or (select count(*) from app_private.checkout_receipts where created_at>now()-interval '24 hours' and ((v_customer is not null and customer_id=v_customer) or (v_customer is null and guest_hash=p_guest_hash)))>=v_limit then raise exception 'checkout_order_limit'; end if;
 -- Prevent catalogue/rule edits between canonical validation and purchase snapshots.
 lock table public.products,public.product_variants,public.discounts,public.discount_rules,public.shipping_rules,public.shipping_zones,public.system_settings,public.inventory_locations in share mode;
 v_quote:=app_private.checkout_quote(p_guest_hash,v_address);
 if v_quote->>'revision'<>p_revision then raise exception 'quote_changed'; end if;
 if (v_quote->>'contains_test_product')::boolean then raise exception 'test_product_not_orderable'; end if;
 v_cart:=(v_quote->'cart'->>'cart_id')::uuid; v_totals:=v_quote->'cart'->'quote';
 -- Acquire missing/expired holds atomically, then transfer them without incrementing reserved twice.
 for r in select * from public.cart_items where cart_id=v_cart order by variant_id loop perform app_private.commerce_set_cart_quantity(v_cart,r.variant_id,r.quantity); end loop;
 select discount_id into v_discount from public.carts where id=v_cart;
 v_required:=coalesce((select (value #>> '{}')::boolean from public.system_settings where key='cod.verification_required'),true);
 insert into public.orders(customer_id,guest_checkout,contact_name,contact_email,contact_phone,status,verification_status,subtotal_pkr,discount_pkr,shipping_pkr,total_pkr,shipping_rule_id,discount_id,idempotency_key,customer_note)
 values(v_customer,v_customer is null,trim(p_input->>'name'),v_email,v_phone,case when v_required then 'pending_verification'::public.order_status else 'confirmed'::public.order_status end,case when v_required then 'pending'::public.verification_status else 'admin_approved'::public.verification_status end,(v_totals->>'subtotal_pkr')::bigint,(v_totals->>'discount_pkr')::bigint,(v_totals->>'shipping_pkr')::bigint,(v_totals->>'total_pkr')::bigint,(v_quote->'delivery'->>'rule_id')::uuid,v_discount,v_key,nullif(trim(p_input->>'notes'),'')) returning id into v_order;
 if not v_required then update public.orders set confirmed_at=now() where id=v_order; end if;
 for r in select ci.*,pv.product_id,pv.sku,pv.title,pv.price_pkr,pv.track_inventory,p.name,pv.attributes from public.cart_items ci join public.product_variants pv on pv.id=ci.variant_id join public.products p on p.id=pv.product_id where ci.cart_id=v_cart order by ci.variant_id loop
  insert into public.order_items(order_id,product_id,variant_id,sku,product_name,variant_name,variant_snapshot,unit_price_pkr,quantity,line_total_pkr) values(v_order,r.product_id,r.variant_id,r.sku,r.name,r.title,jsonb_build_object('attributes',r.attributes,'track_inventory',r.track_inventory),r.price_pkr,r.quantity,r.price_pkr*r.quantity) returning id into v_item;
  for h in select * from public.inventory_reservations where cart_item_id=r.id and status='active' for update loop
   insert into public.order_inventory_reservations(order_id,order_item_id,variant_id,location_id,source_cart_reservation_id,quantity) values(v_order,v_item,h.variant_id,h.location_id,h.id,h.quantity);
   update public.inventory_reservations set status='converted',released_at=now(),release_reason='Transferred to COD order '||v_order where id=h.id;
  end loop;
 end loop;
 insert into public.order_addresses(order_id,recipient_name,phone,address_line1,address_line2,city,province,postal_code) values(v_order,trim(p_input->>'name'),v_phone,v_address->>'line1',nullif(v_address->>'line2',''),trim(v_address->>'city'),v_address->>'province',nullif(v_address->>'postalCode',''));
 insert into public.order_status_history(order_id,to_status,note,changed_by) select v_order,status,'COD order placed; totals and inventory validated',auth.uid() from public.orders where id=v_order;
 if v_required then insert into public.cod_verifications(order_id,attempt_number,method,status,note) values(v_order,1,'admin','pending','Awaiting operator verification; no outbound verification message sent'); end if;
 if v_discount is not null then insert into public.discount_redemptions(discount_id,order_id,customer_id,amount_pkr) values(v_discount,v_order,v_customer,(v_totals->>'discount_pkr')::bigint); end if;
 insert into app_private.checkout_receipts(order_id,customer_id,guest_hash,request_hash) values(v_order,v_customer,case when v_customer is null then p_guest_hash else null end,v_hash);
 if v_customer is not null then
  insert into public.notifications(recipient_customer_id,event_key,title,body,entity_type,entity_id,data) values(v_customer,'order.placed','Order received','Your Cash on Delivery order has been received.','order',v_order,jsonb_build_object('href','/account/orders/'||v_order)) returning id into v_notification;
  insert into public.notification_deliveries(notification_id,channel,status,provider) values(v_notification,'email','pending','resend');
 end if;
 insert into public.notifications(recipient_user_id,event_key,title,body,priority,entity_type,entity_id,data) select user_id,'order.placed','New COD order','A new Cash on Delivery order awaits processing.','high','order',v_order,jsonb_build_object('href','/crm','order_id',v_order) from public.staff_profiles where is_active and role_slug='super_admin';
 select 'DWELLUNE — Order '||order_number||E'\n\nWe have received your Cash on Delivery order. '||case when v_required then 'It is awaiting verification.' else 'It is confirmed.' end||E'\n\n' into v_text from public.orders where id=v_order;
 for r in select * from public.order_items where order_id=v_order order by created_at,id loop v_text:=v_text||r.product_name||' / '||r.variant_name||' × '||r.quantity||' — PKR '||r.line_total_pkr||E'\n'; end loop;
 v_text:=v_text||E'\nSubtotal: PKR '||(v_totals->>'subtotal_pkr')||E'\nDiscount: PKR '||(v_totals->>'discount_pkr')||E'\nDelivery: PKR '||(v_totals->>'shipping_pkr')||E'\nDue on delivery: PKR '||(v_totals->>'total_pkr')||E'\n\nNo online payment is required. Keep your order number for support.\n';
 insert into app_private.order_email_outbox(order_id,notification_id,payload) select v_order,v_notification,jsonb_build_object('to',jsonb_build_array(v_email),'subject','DWELLUNE — Order '||order_number||' received','text',v_text) from public.orders where id=v_order;
 update public.carts set status='converted',converted_order_id=v_order,guest_token_hash=case when v_customer is null then encode(extensions.digest('converted:'||v_order::text,'sha256'),'hex') else null end,updated_at=now() where id=v_cart;
 return app_private.checkout_confirmation(v_order,p_guest_hash);
end; $$;
revoke all on function app_private.checkout_place_order(text,uuid,text,jsonb) from public;
grant execute on function app_private.checkout_place_order(text,uuid,text,jsonb) to anon,authenticated;
create function public.checkout_place_order(p_guest_hash text,p_key uuid,p_revision text,p_input jsonb) returns jsonb language sql security invoker set search_path='' as $$ select app_private.checkout_place_order(p_guest_hash,p_key,p_revision,p_input); $$;
revoke all on function public.checkout_place_order(text,uuid,text,jsonb) from public;
grant execute on function public.checkout_place_order(text,uuid,text,jsonb) to anon,authenticated;

create function app_private.release_cancelled_order_inventory() returns trigger language plpgsql security definer set search_path='' as $$
declare r record; v_on_hand int; v_reserved int;
begin
 if new.status='cancelled' and old.status is distinct from new.status then
  perform app_private.commerce_lock();
  for r in select * from public.order_inventory_reservations where order_id=new.id and status='active' order by variant_id,location_id for update loop
   update public.inventory_balances set reserved=reserved-r.quantity where variant_id=r.variant_id and location_id=r.location_id returning on_hand,reserved into v_on_hand,v_reserved;
   if not found then raise exception 'inventory_balance_missing'; end if;
   insert into public.inventory_ledger(variant_id,location_id,event_type,delta_reserved,balance_on_hand,balance_reserved,reference_type,reference_id,note,actor_user_id) values(r.variant_id,r.location_id,'reservation_release',-r.quantity,v_on_hand,v_reserved,'order',new.id,'Cancelled COD order reservation released',auth.uid());
   update public.order_inventory_reservations set status='released',released_at=now() where id=r.id;
  end loop;
 end if;
 return new;
end; $$;
revoke all on function app_private.release_cancelled_order_inventory() from public,anon,authenticated;
create trigger release_cancelled_order_inventory after update of status on public.orders for each row execute function app_private.release_cancelled_order_inventory();

-- Cron-driven durable dispatch. No browser or app service-role credential required.
create function app_private.dispatch_order_emails() returns int language plpgsql security definer set search_path='' as $$
declare v_key text; v_from text; v_count int:=0; v_response record; v_payload jsonb; v_status text; v_code text; r record;
begin
 if not pg_try_advisory_xact_lock(734211,8) then return 0; end if;
 for r in select * from app_private.order_email_outbox where status='sending' for update skip locked loop
  select status_code,timed_out,body into v_response from net._http_response where id=r.request_id;
  if found then
   if v_response.status_code between 200 and 299 then
    begin v_payload:=v_response.body::jsonb; exception when others then v_payload:='{}'; end;
    if nullif(v_payload->>'id','') is not null then
     update app_private.order_email_outbox set status='sent',sent_at=now(),provider_message_id=v_payload->>'id',last_error_code=null where id=r.id;
     update public.notification_deliveries set status='sent',sent_at=now(),provider_message_id=v_payload->>'id',attempt_count=r.attempt_count where notification_id=r.notification_id and channel='email';
     continue;
    end if;
   end if;
   v_code:=case when v_response.timed_out then 'network_timeout' else 'http_'||coalesce(v_response.status_code::text,'unknown') end;
   v_status:=case when coalesce(v_response.timed_out,false) or v_response.status_code>=500 or v_response.status_code=429 or v_response.status_code is null then 'pending' else 'failed' end;
  elsif r.next_attempt_at<now() then v_code:='response_timeout';v_status:='pending';
  else continue; end if;
  if r.attempt_count>=5 or r.first_attempt_at<now()-interval '22 hours' then v_status:='failed'; end if;
  update app_private.order_email_outbox set status=v_status,last_error_code=v_code,request_id=null,next_attempt_at=now()+make_interval(mins=>least(60,power(2,r.attempt_count)::int)) where id=r.id;
 end loop;
 -- Notify operators once for permanent/exhausted failure, without exposing provider bodies.
 for r in select e.* from app_private.order_email_outbox e where e.status='failed' and not exists(select 1 from public.notifications n where n.event_key='order.email_failed' and n.entity_id=e.order_id) loop
  insert into public.notifications(recipient_user_id,event_key,title,body,priority,entity_type,entity_id,data) select user_id,'order.email_failed','Order email requires attention','The order is saved, but confirmation email delivery failed.','high','order',r.order_id,jsonb_build_object('href','/crm') from public.staff_profiles where is_active and role_slug='super_admin';
  update public.notification_deliveries set status='failed',failed_at=now(),attempt_count=r.attempt_count,last_error_code=r.last_error_code where notification_id=r.notification_id and channel='email';
 end loop;
 select decrypted_secret into v_key from vault.decrypted_secrets where name='dwellune_resend_api_key' limit 1;
 select decrypted_secret into v_from from vault.decrypted_secrets where name='dwellune_order_email_from' limit 1;
 if length(coalesce(v_key,''))<20 or v_from is null then return v_count; end if;
 for r in select * from app_private.order_email_outbox where status='pending' and next_attempt_at<=now() order by created_at limit 5 for update skip locked loop
  if r.first_attempt_at<now()-interval '22 hours' then update app_private.order_email_outbox set status='failed',last_error_code='retry_window_exceeded' where id=r.id; continue; end if;
  v_payload:=r.payload;
  if v_payload->>'from' is null then v_payload:=v_payload||jsonb_build_object('from','DWELLUNE <'||v_from||'>','reply_to','dwellunestore@gmail.com'); end if;
  update app_private.order_email_outbox set payload=v_payload,status='sending',attempt_count=attempt_count+1,first_attempt_at=coalesce(first_attempt_at,now()),next_attempt_at=now()+interval '5 minutes',request_id=net.http_post(url:='https://api.resend.com/emails',headers:=jsonb_build_object('Authorization','Bearer '||v_key,'Content-Type','application/json','Idempotency-Key','dwellune-order-placed-v1-'||r.order_id),body:=v_payload,timeout_milliseconds:=10000) where id=r.id;
  v_count:=v_count+1;
 end loop;
 return v_count;
end; $$;
revoke all on function app_private.dispatch_order_emails() from public,anon,authenticated;
select cron.schedule('dwellune-order-confirmation-emails','* * * * *','select app_private.dispatch_order_emails();');
