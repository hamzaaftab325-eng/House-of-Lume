-- Part 1 only: derive an address-specific quote. No orders or notification records are created.
create function app_private.checkout_quote(p_guest_token_hash text, p_address jsonb)
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
 if nullif(v_cart->'quote'->>'discount_error','') is not null then raise exception 'discount_not_eligible'; end if;
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
 v_discount:=app_private.commerce_discount_quote(v_cart_id);
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
  'delivery',jsonb_build_object('name',v_rule.name,'zone',v_zone.name,'surcharge_pkr',v_rule.remote_surcharge_pkr,'cod_min_pkr',v_rule.cod_min_order_pkr,'cod_max_pkr',v_rule.cod_max_order_pkr),
  'needs_stock_revalidation',exists(select 1 from jsonb_array_elements(v_cart->'lines') l where l->>'stock_state'='revalidation_required'),
  'contains_test_product',exists(select 1 from public.cart_items ci join public.product_variants pv on pv.id=ci.variant_id join public.products p on p.id=pv.product_id where ci.cart_id=v_cart_id and p.specifications->>'test_product'='true'));
end; $$;
revoke all on function app_private.checkout_quote(text,jsonb) from public;
grant execute on function app_private.checkout_quote(text,jsonb) to anon,authenticated;
create function public.checkout_quote(p_guest_token_hash text, p_address jsonb)
returns jsonb language sql security invoker set search_path = '' as $$ select app_private.checkout_quote(p_guest_token_hash,p_address); $$;
revoke all on function public.checkout_quote(text,jsonb) from public;
grant execute on function public.checkout_quote(text,jsonb) to anon,authenticated;
