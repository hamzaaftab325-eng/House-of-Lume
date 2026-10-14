-- Production-project rollback probes using the owner-approved demonstration variant.
-- No fixture, stock adjustment, order or email survives this transaction.
begin;
create or replace function app_private.checkout_release_ready() returns boolean language sql stable security definer set search_path='' as $$ select true; $$;
do $$ declare q jsonb; v uuid; i jsonb:='{"name":"Rollback probe","email":"test@example.invalid","phone":"03001234567","address":{"line1":"Test street 123","line2":"","city":"Lahore","province":"Punjab","postalCode":"54000","country":"PK"},"notes":"","terms":true}'; begin
select id into v from public.product_variants where sku='DWELLUNE-TEST-LAMP-001';
if v is null then raise exception 'approved test variant missing';end if;
perform public.commerce_cart_add(repeat('e',64),v,1);
q:=public.checkout_quote(repeat('e',64),i->'address');
begin perform public.checkout_place_order(repeat('e',64),gen_random_uuid(),q->>'revision',i);raise exception 'test item order accepted';exception when others then if sqlerrm<>'test_product_not_orderable' then raise;end if;end;
end $$;
update public.products set specifications=specifications||'{"test_product":false}' where id=(select product_id from public.product_variants where sku='DWELLUNE-TEST-LAMP-001');
do $$ declare q jsonb; x jsonb; v uuid; before_reserved int; k uuid:=gen_random_uuid(); i jsonb:='{"name":"Rollback probe","email":"test@example.invalid","phone":"03001234567","address":{"line1":"Test street 123","line2":"","city":"Lahore","province":"Punjab","postalCode":"54000","country":"PK"},"notes":"","terms":true}'; begin
select id into v from public.product_variants where sku='DWELLUNE-TEST-LAMP-001';
select sum(reserved) into before_reserved from public.inventory_balances where variant_id=v;
perform public.commerce_cart_add(repeat('c',64),v,1);
q:=public.checkout_quote(repeat('c',64),i->'address');
update public.product_variants set price_pkr=price_pkr+1 where id=v;
begin perform public.checkout_place_order(repeat('c',64),k,q->>'revision',i);raise exception 'stale total accepted';exception when others then if sqlerrm<>'quote_changed' then raise;end if;end;
if public.checkout_recover_attempt(repeat('c',64),k) is not null then raise exception 'failed order survived';end if;
q:=public.checkout_quote(repeat('c',64),i->'address');
x:=public.checkout_place_order(repeat('c',64),k,q->>'revision',i);
if public.checkout_recover_attempt(repeat('c',64),k)->>'id'<>x->>'id' or public.checkout_recover_attempt(repeat('d',64),k) is not null then raise exception 'attempt recovery ownership failed';end if;
update public.orders set status='cancelled' where id=(x->>'id')::uuid;
if (select sum(reserved) from public.inventory_balances where variant_id=v)<>before_reserved then raise exception 'reservation leaked after cancellation';end if;
end $$;
select 'Test product denial, stale quote rollback, revised price, private recovery and cancellation balance passed' as result;
rollback;

begin;
insert into public.shipping_zones(id,name,code,country_code,cities,is_nationwide) values('89900000-0000-4000-8000-000000000001','Rollback Lahore','P8B-LAHORE','PK',array['Lahore'],false);
insert into public.shipping_rules(zone_id,name,flat_fee_pkr,free_shipping_threshold_pkr) values('89900000-0000-4000-8000-000000000001','Rollback city rule',50,null);
insert into public.discounts(id,code,name,discount_type,fixed_amount_pkr) values('89800000-0000-4000-8000-000000000001','P8B-CITY-ROLLBACK','Rollback city discount','fixed_amount',100);
insert into public.discount_rules(discount_id,rule_type,rule_config) values('89800000-0000-4000-8000-000000000001','shipping_zone','{"zone_ids":["89900000-0000-4000-8000-000000000001"]}');
do $$ declare v uuid;q jsonb;begin
select id into v from public.product_variants where sku='DWELLUNE-TEST-LAMP-001';
perform public.commerce_cart_add(repeat('f',64),v,1);
q:=public.checkout_apply_discount(repeat('f',64),'{"country":"PK","city":"Lahore","province":"Punjab"}','P8B-CITY-ROLLBACK');
if (q->'cart'->'quote'->>'discount_pkr')::int<>100 or (q->'cart'->'quote'->>'shipping_pkr')::int<>50 then raise exception 'address discount failed';end if;
begin perform public.checkout_apply_discount(repeat('f',64),'{"country":"PK","city":"Karachi","province":"Sindh"}','P8B-CITY-ROLLBACK');raise exception 'foreign zone discount accepted';exception when others then if sqlerrm<>'discount_not_eligible' then raise;end if;end;
perform public.checkout_apply_discount(repeat('f',64),'{"country":"PK","city":"Karachi","province":"Sindh"}','');
end $$;
select 'Address-scoped discount, city delivery fee, wrong-zone denial and removal passed' as result;
rollback;
