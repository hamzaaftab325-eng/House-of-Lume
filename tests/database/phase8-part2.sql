-- Run with the new migration inside the same BEGIN/ROLLBACK before applying it.
begin;
create temporary table p8b_checks(name text primary key);
grant all on p8b_checks to anon,authenticated;
create temporary table p8b_state(input jsonb,revision text,order_id uuid);
grant all on p8b_state to anon,authenticated;
do $$ begin if public.checkout_release_ready() then raise exception 'unexpected open release gate';end if;end $$;
-- Mock only the external release-readiness gate; all order business functions remain real.
create or replace function app_private.checkout_release_ready() returns boolean language sql stable security definer set search_path='' as $$ select true; $$;
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
('89000000-0000-4000-8000-000000000001','p8b-a@example.invalid',now(),'{}'),('89000000-0000-4000-8000-000000000002','p8b-b@example.invalid',now(),'{}');
insert into auth.sessions(id,user_id,created_at,not_after) values
('89100000-0000-4000-8000-000000000001','89000000-0000-4000-8000-000000000001',now(),now()+interval '1 hour'),('89100000-0000-4000-8000-000000000002','89000000-0000-4000-8000-000000000002',now(),now()+interval '1 hour');
insert into public.staff_profiles(user_id,role_slug) values('89000000-0000-4000-8000-000000000002','super_admin');
insert into public.products(id,product_type,status,name,slug,published_at) values('89200000-0000-4000-8000-000000000001','lamp','active','Rollback order fixture','p8b-rollback-lamp',now());
insert into public.product_variants(id,product_id,sku,title,price_pkr,track_inventory) values('89300000-0000-4000-8000-000000000001','89200000-0000-4000-8000-000000000001','P8B-ROLLBACK','Fixture',1000,true);
insert into public.inventory_balances(variant_id,location_id,on_hand) select '89300000-0000-4000-8000-000000000001',id,5 from public.inventory_locations where code='MAIN-PK';
insert into p8b_state(input) values('{"name":"Order test","email":"p8b@example.invalid","phone":"03001234567","address":{"line1":"Test street 123","line2":"","city":"Lahore","province":"Punjab","postalCode":"54000","country":"PK"},"notes":"Test note","terms":true}');
set local role anon;
select set_config('request.jwt.claims','{}',true);
select public.commerce_cart_add(repeat('9',64),'89300000-0000-4000-8000-000000000001',2);
update p8b_state set revision=public.checkout_quote(repeat('9',64),input->'address')->>'revision';
update p8b_state set order_id=(public.checkout_place_order(repeat('9',64),'89400000-0000-4000-8000-000000000001',revision,input)->>'id')::uuid;
do $$ declare x jsonb;s p8b_state%rowtype;begin select * into s from p8b_state;x:=public.checkout_place_order(repeat('9',64),'89400000-0000-4000-8000-000000000001',s.revision,s.input);if x->>'id'<>s.order_id::text then raise exception 'duplicate order created';end if;
 begin perform public.checkout_place_order(repeat('9',64),'89400000-0000-4000-8000-000000000001',s.revision,s.input||'{"notes":"changed"}');raise exception 'conflicting replay accepted';exception when others then if sqlerrm<>'idempotency_conflict' then raise;end if;end;
 begin perform public.checkout_confirmation(s.order_id,repeat('a',64));raise exception 'foreign receipt exposed';exception when others then if sqlerrm<>'order_unavailable' then raise;end if;end;
 if (public.commerce_cart_snapshot(repeat('9',64))->>'item_count')::int<>0 then raise exception 'submitted cart still active';end if;
 insert into p8b_checks values('guest order, idempotent replay/conflict, private receipt and cleared bag');end $$;
reset role;
do $$ declare s p8b_state%rowtype;begin select * into s from p8b_state;
 if (select count(*) from public.order_items where order_id=s.order_id)<>1 or (select sum(quantity) from public.order_inventory_reservations where order_id=s.order_id)<>2 or (select reserved from public.inventory_balances where variant_id='89300000-0000-4000-8000-000000000001')<>2 then raise exception 'reservation transfer duplicated or missing';end if;
 if not exists(select 1 from public.order_addresses where order_id=s.order_id and city='Lahore') or not exists(select 1 from public.order_status_history where order_id=s.order_id) or not exists(select 1 from public.cod_verifications where order_id=s.order_id and status='pending') then raise exception 'order snapshots missing';end if;
 if (select count(*) from app_private.order_email_outbox where order_id=s.order_id)<>1 or (select count(*) from public.notifications where entity_id=s.order_id and event_key='order.placed')<>1 then raise exception 'notification dedupe failed';end if;
 insert into p8b_checks values('stock transfer, item/address/history/COD snapshots, staff and one email event');end $$;
update public.orders set status='cancelled' where id=(select order_id from p8b_state);
update public.orders set status='cancelled' where id=(select order_id from p8b_state);
do $$ begin if (select reserved from public.inventory_balances where variant_id='89300000-0000-4000-8000-000000000001')<>0 then raise exception 'cancelled stock not released once';end if;insert into p8b_checks values('cancellation releases order holds exactly once');end $$;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"89000000-0000-4000-8000-000000000001","role":"authenticated","session_id":"89100000-0000-4000-8000-000000000001"}',true);
select public.commerce_cart_add('', '89300000-0000-4000-8000-000000000001',1);
update p8b_state set revision=public.checkout_quote('',input->'address')->>'revision';
update p8b_state set order_id=(public.checkout_place_order('','89400000-0000-4000-8000-000000000002',revision,input)->>'id')::uuid;
select set_config('request.jwt.claims','{"sub":"89000000-0000-4000-8000-000000000002","role":"authenticated","session_id":"89100000-0000-4000-8000-000000000002"}',true);
do $$ begin begin perform public.checkout_confirmation((select order_id from p8b_state),'');raise exception 'foreign account order exposed';exception when others then if sqlerrm<>'order_unavailable' then raise;end if;end;insert into p8b_checks values('signed-in order and foreign account denial');end $$;
reset role;
do $$ declare oid uuid;begin select order_id into oid from p8b_state;if (select count(*) from public.notifications where entity_id=oid and event_key='order.placed')<>2 or (select contact_email from public.orders where id=oid)<>'p8b-a@example.invalid' then raise exception 'account email or notifications invalid';end if;insert into p8b_checks values('canonical account email and customer/staff notification delivery records');end $$;
select jsonb_agg(name) as passed from p8b_checks;
rollback;
