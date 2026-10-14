begin;
-- Isolate policy-unavailable acceptance while restoring the merchant policy on rollback.
delete from public.system_settings where key='returns.policy';
-- Execute only inside BEGIN/ROLLBACK, after the Phase 7 migration.
-- Five test products, two identities and all associated records disappear on rollback.
create temporary table phase7_checks(name text primary key);
grant all on phase7_checks to authenticated;
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
('77000000-0000-4000-8000-000000000001','phase7-a@example.invalid',now(),'{"full_name":"Test customer A"}'),
('77000000-0000-4000-8000-000000000002','phase7-b@example.invalid',now(),'{"full_name":"Test customer B"}');
insert into auth.sessions(id,user_id,created_at,not_after) values
('77100000-0000-4000-8000-000000000001','77000000-0000-4000-8000-000000000001',now(),now()+interval '1 hour'),
('77100000-0000-4000-8000-000000000002','77000000-0000-4000-8000-000000000002',now(),now()+interval '1 hour');
insert into public.products(id,product_type,status,name,slug,published_at)
select ('77200000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,t::public.product_type,'active',name, 'phase7-rollback-'||n,now()
from (values(1,'lamp','TEST Table Lamp'),(2,'lamp','TEST Floor Lamp'),(3,'planter','TEST Ceramic Planter'),(4,'mirror','TEST Decorative Mirror'),(5,'candle','TEST Scented Candle')) v(n,t,name);
insert into public.product_variants(id,product_id,sku,title,price_pkr,track_inventory)
select ('77300000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,('77200000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'P7-TEST-'||n,'Test standard',1000*n,false from generate_series(1,5) n;
insert into public.orders(id,order_number,customer_id,contact_name,contact_phone,status,subtotal_pkr,total_pkr,idempotency_key,delivered_at)
select ('77400000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,970000+n,c.id,'Test recipient','03000000000','delivered',2000,2000,'p7-rollback-'||n,now()-interval '1 day'
from generate_series(1,2) n join public.customers c on c.user_id=('77000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid;
insert into public.order_items(id,order_id,product_id,variant_id,sku,product_name,variant_name,unit_price_pkr,quantity,line_total_pkr)
select ('77500000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,('77400000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'77200000-0000-4000-8000-000000000001','77300000-0000-4000-8000-000000000001','P7-TEST-1','TEST Table Lamp','Standard',1000,2,2000 from generate_series(1,2) n;
insert into public.order_status_history(order_id,to_status,note) values('77400000-0000-4000-8000-000000000001','delivered','Staff-only test note');
insert into public.notifications(id,recipient_customer_id,event_key,title,body,entity_type,entity_id)
select ('77600000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,c.id,'test_order_delivered','Test delivery','Test-only notification','order',('77400000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid from generate_series(1,2) n join public.customers c on c.user_id=('77000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"77000000-0000-4000-8000-000000000001","role":"authenticated","session_id":"77100000-0000-4000-8000-000000000001"}',true);
do $$ declare a uuid; b uuid; c uuid; q jsonb; begin
 if not public.account_session_valid() then raise exception 'valid session denied'; end if;
 perform public.account_save_profile('Updated test name','03000000000','');
 if not exists(select 1 from public.customers where full_name='Updated test name') or not exists(select 1 from public.profiles where display_name='Updated test name') then raise exception 'profile persistence failed'; end if;
 insert into phase7_checks values('profile and customer update atomically');
 a:=public.account_save_address('{"label":"TEST A","recipient":"Test recipient","phone":"03000000000","line1":"Test street 123","line2":"","city":"Lahore","province":"Punjab","postalCode":"54000","default":false}');
 b:=public.account_save_address('{"label":"TEST B","recipient":"Test recipient","phone":"03000000000","line1":"Test street 456","line2":"","city":"Lahore","province":"Punjab","postalCode":"54000","default":true}');
 if (select count(*) from public.customer_addresses where is_default)<>1 or not exists(select 1 from public.customer_addresses where id=b and is_default) then raise exception 'default address conflict'; end if;
 perform public.account_delete_address(b);
 if not exists(select 1 from public.customer_addresses where id=a and is_default) then raise exception 'default address fallback failed'; end if;
 insert into phase7_checks values('address creation, default replacement and delete fallback');
 perform public.account_save_preferences(true);
 if not exists(select 1 from public.notification_preferences where email_marketing and email_order_updates and in_app_order_updates) then raise exception 'essential preferences altered'; end if;
 perform public.account_save_preferences(false);
 if exists(select 1 from public.notification_preferences where email_marketing) then raise exception 'preference persistence failed'; end if;
 insert into phase7_checks values('marketing preference persists without disabling essential messages');
 if (select count(order_number) from public.orders)<>1 or (select count(*) from public.order_items)<>1 or (select count(to_status) from public.order_status_history)<>1 then raise exception 'order ownership failed'; end if;
 if exists(select 1 from public.orders where id='77400000-0000-4000-8000-000000000002') then raise exception 'foreign order exposed'; end if;
 insert into phase7_checks values('owned order, item and history reads; foreign order denied');
 update public.notifications set read_at=now() where id='77600000-0000-4000-8000-000000000001';
 if not exists(select 1 from public.notifications where read_at is not null) then raise exception 'read state failed'; end if;
 update public.notifications set read_at=now() where id='77600000-0000-4000-8000-000000000002';
 if found then raise exception 'foreign notification updated'; end if;
 insert into phase7_checks values('notification read state and foreign-write denial');
 perform public.commerce_wishlist_merge(array['77300000-0000-4000-8000-000000000001'::uuid,'77300000-0000-4000-8000-000000000002'::uuid]);
 q:=public.commerce_wishlist_snapshot();
 if jsonb_array_length(q->'lines')<>2 then raise exception 'wishlist sync failed'; end if;
 q:=public.commerce_wishlist_move_to_cart(repeat('7',64),'77300000-0000-4000-8000-000000000001');
 if (q->>'item_count')::int<>1 then raise exception 'wishlist move failed'; end if;
 insert into phase7_checks values('authenticated wishlist merge and atomic cart move');
 begin perform public.account_request_return('77400000-0000-4000-8000-000000000001','damaged','Test', '[{"id":"77500000-0000-4000-8000-000000000001","quantity":1}]','77700000-0000-4000-8000-000000000001'); raise exception 'missing policy accepted'; exception when others then if sqlerrm<>'return_policy_unavailable' then raise; end if; end;
 insert into phase7_checks values('return requests fail closed without published policy');
end $$;
reset role;
insert into public.system_settings(key,value,is_public) values('returns.policy','{"enabled":true,"window_days":7,"reason_codes":["damaged","incorrect","change_of_mind"],"excluded_product_ids":[],"refund_procedure":"Test policy only. No refund is sent from this test."}',true)
on conflict(key) do update set value=excluded.value,is_public=true;
set local role authenticated;
do $$ declare a uuid; b uuid; begin
 a:=public.account_request_return('77400000-0000-4000-8000-000000000001','damaged','Test','[{"id":"77500000-0000-4000-8000-000000000001","quantity":1}]','77700000-0000-4000-8000-000000000001');
 b:=public.account_request_return('77400000-0000-4000-8000-000000000001','damaged','Test','[{"id":"77500000-0000-4000-8000-000000000001","quantity":1}]','77700000-0000-4000-8000-000000000001');
 if a<>b or (select count(*) from public.returns)<>1 then raise exception 'return replay duplicated'; end if;
 begin perform public.account_request_return('77400000-0000-4000-8000-000000000001','incorrect','Test','[{"id":"77500000-0000-4000-8000-000000000001","quantity":1}]','77700000-0000-4000-8000-000000000001'); raise exception 'changed replay accepted'; exception when others then if sqlerrm<>'request_replay_mismatch' then raise; end if; end;
 insert into phase7_checks values('return persistence, idempotent replay and changed-payload rejection');
 begin perform public.account_request_return('77400000-0000-4000-8000-000000000001','damaged','Test','[{"id":"77500000-0000-4000-8000-000000000001","quantity":2}]','77700000-0000-4000-8000-000000000002'); raise exception 'excess return accepted'; exception when others then if sqlerrm<>'return_quantity_exceeded' then raise; end if; end;
 begin perform public.account_request_return('77400000-0000-4000-8000-000000000002','damaged','Test','[{"id":"77500000-0000-4000-8000-000000000002","quantity":1}]','77700000-0000-4000-8000-000000000003'); raise exception 'foreign return accepted'; exception when others then if sqlerrm<>'order_not_returnable' then raise; end if; end;
 begin perform public.account_request_return('77400000-0000-4000-8000-000000000001','damaged','Test','[{"id":"77500000-0000-4000-8000-000000000002","quantity":1}]','77700000-0000-4000-8000-000000000004'); raise exception 'foreign item accepted'; exception when others then if sqlerrm<>'invalid_return_item' then raise; end if; end;
 if (select count(*) from public.returns)<>1 or (select count(*) from public.return_items)<>1 then raise exception 'failed return left partial data'; end if;
 insert into phase7_checks values('return overquantity, foreign order/item and partial-write rejection');
end $$;
select set_config('request.jwt.claims','{"sub":"77000000-0000-4000-8000-000000000002","role":"authenticated","session_id":"77100000-0000-4000-8000-000000000002"}',true);
do $$ declare q jsonb; begin
 if exists(select 1 from public.customers where full_name='Updated test name') or exists(select 1 from public.customer_addresses) or exists(select 1 from public.returns) then raise exception 'customer data leaked'; end if;
 q:=public.commerce_wishlist_snapshot(); if jsonb_array_length(q->'lines')<>0 then raise exception 'foreign wishlist exposed'; end if;
 q:=public.commerce_cart_snapshot(repeat('7',64)); if (q->>'item_count')::int<>0 then raise exception 'foreign cart claimed'; end if;
 begin perform public.account_delete_address((select id from public.customer_addresses limit 1)); raise exception 'foreign address delete accepted'; exception when others then if sqlerrm<>'address_unavailable' then raise; end if; end;
 insert into phase7_checks values('second customer isolated across profile, address, cart, wishlist and returns');
end $$;
reset role;
update auth.sessions set not_after=now()-interval '1 minute' where id='77100000-0000-4000-8000-000000000002';
set local role authenticated;
do $$ begin
 if public.account_session_valid() then raise exception 'expired session accepted'; end if;
 if (select count(*) from public.customers)<>0 or (select count(order_number) from public.orders)<>0 then raise exception 'expired JWT leaked rows'; end if;
 begin perform public.account_save_profile('Invalid update','',''); raise exception 'expired session write accepted'; exception when others then if sqlerrm<>'authentication_required' then raise; end if; end;
 insert into phase7_checks values('expired session denies direct reads and RPC writes');
end $$;
reset role;
update auth.users set email_confirmed_at=null where id='77000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"77000000-0000-4000-8000-000000000001","role":"authenticated","session_id":"77100000-0000-4000-8000-000000000001"}',true);
do $$ begin if public.account_session_valid() then raise exception 'unverified email accepted'; end if; insert into phase7_checks values('unverified email rejected at database boundary'); end $$;
reset role;
update auth.users set email_confirmed_at=now() where id='77000000-0000-4000-8000-000000000001';
delete from auth.sessions where id='77100000-0000-4000-8000-000000000001';
set local role authenticated;
do $$ begin
 if public.account_session_valid() or (select count(*) from public.notifications)>0 then raise exception 'revoked session accepted'; end if;
 begin perform public.commerce_wishlist_snapshot(); raise exception 'revoked wishlist accepted'; exception when others then if sqlerrm<>'authentication_required' then raise; end if; end;
 insert into phase7_checks values('revoked JWT denies notifications and commerce RPC');
end $$;
reset role;
select name from phase7_checks order by name;

rollback;
