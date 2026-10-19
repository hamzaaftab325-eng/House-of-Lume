-- Real contracts, rollback-only fixtures. No real order/email/contact action is performed.
begin;
create temporary table p9_state(order_id uuid,first_result jsonb,admin_id uuid);
grant all on p9_state to authenticated;
insert into p9_state(order_id,admin_id) select '93000000-0000-4000-8000-000000000001',user_id from app_private.store_owner where singleton;
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values('93100000-0000-4000-8000-000000000001','p9-customer@example.invalid',now(),'{"role":"super_admin"}');
insert into auth.sessions(id,user_id,created_at,not_after) values('93200000-0000-4000-8000-000000000001','93100000-0000-4000-8000-000000000001',now(),now()+interval '1 hour');
insert into auth.sessions(id,user_id,created_at,not_after) select '93200000-0000-4000-8000-000000000002',admin_id,now(),now()+interval '1 hour' from p9_state;
insert into public.products(id,product_type,status,name,slug,published_at) values('93300000-0000-4000-8000-000000000001','lamp','active','Rollback verification fixture','p9-rollback-lamp',now());
insert into public.product_variants(id,product_id,sku,title,price_pkr,track_inventory) values('93400000-0000-4000-8000-000000000001','93300000-0000-4000-8000-000000000001','P9-ROLLBACK','Fixture',1000,true);
insert into public.inventory_balances(variant_id,location_id,on_hand,reserved) select '93400000-0000-4000-8000-000000000001',id,5,2 from public.inventory_locations where code='MAIN-PK';
insert into public.orders(id,customer_id,contact_name,contact_email,contact_phone,subtotal_pkr,total_pkr,idempotency_key)
 select '93000000-0000-4000-8000-000000000001',id,'Rollback customer','p9-customer@example.invalid','+923001234567',2000,2000,'p9-fixture-1' from public.customers where user_id='93100000-0000-4000-8000-000000000001';
insert into public.orders(id,guest_checkout,contact_name,contact_phone,subtotal_pkr,total_pkr,idempotency_key) values('93000000-0000-4000-8000-000000000002',true,'Rollback guest','+923001234568',1000,1000,'p9-fixture-2');
insert into public.order_items(id,order_id,product_id,variant_id,sku,product_name,variant_name,unit_price_pkr,quantity,line_total_pkr)
 values('93500000-0000-4000-8000-000000000001','93000000-0000-4000-8000-000000000001','93300000-0000-4000-8000-000000000001','93400000-0000-4000-8000-000000000001','P9-ROLLBACK','Fixture lamp','Fixture',1000,2,2000);
insert into public.order_inventory_reservations(order_id,order_item_id,variant_id,location_id,source_cart_reservation_id,quantity)
 select '93000000-0000-4000-8000-000000000001','93500000-0000-4000-8000-000000000001','93400000-0000-4000-8000-000000000001',id,'93600000-0000-4000-8000-000000000001',2 from public.inventory_locations where code='MAIN-PK';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"93100000-0000-4000-8000-000000000001","role":"authenticated","session_id":"93200000-0000-4000-8000-000000000001"}',true);
do $$ begin
 begin perform public.staff_verification_queue();raise exception 'customer/spoofed metadata received queue';exception when others then if sqlerrm<>'staff_access_required' then raise;end if;end;
 begin perform public.staff_verification_detail('93000000-0000-4000-8000-000000000001');raise exception 'customer received staff detail';exception when others then if sqlerrm<>'staff_access_required' then raise;end if;end;
 begin perform public.staff_verification_action('93000000-0000-4000-8000-000000000001',gen_random_uuid(),'{"action":"confirm","expectedRevision":0,"note":"spoofed role"}');raise exception 'customer wrote staff action';exception when others then if sqlerrm<>'staff_access_required' then raise;end if;end;
 begin perform count(*) from public.cod_verifications;raise exception 'private staff notes exposed';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',(select admin_id from p9_state),'role','authenticated','session_id','93200000-0000-4000-8000-000000000002')::text,true);
do $$ declare x jsonb;begin
 x:=public.staff_verification_queue('pending');if not exists(select 1 from jsonb_array_elements(x->'items') i where i->>'id'='93000000-0000-4000-8000-000000000001') then raise exception 'queue fixture missing';end if;
 x:=public.staff_verification_detail('93000000-0000-4000-8000-000000000001');if not (x->>'can_verify')::boolean or not (x->>'can_cancel')::boolean then raise exception 'pending workflow missing';end if;
 x:=public.staff_verification_action('93000000-0000-4000-8000-000000000001','93700000-0000-4000-8000-000000000001','{"action":"contact","expectedRevision":0,"note":"Customer reached by phone; private staff note.","channel":"phone","outcome":"reached"}');
 update p9_state set first_result=x;
 if x is distinct from public.staff_verification_action('93000000-0000-4000-8000-000000000001','93700000-0000-4000-8000-000000000001','{"action":"contact","expectedRevision":0,"note":"Customer reached by phone; private staff note.","channel":"phone","outcome":"reached"}') then raise exception 'replay changed';end if;
 begin perform public.staff_verification_action('93000000-0000-4000-8000-000000000001','93700000-0000-4000-8000-000000000001','{"action":"contact","expectedRevision":0,"note":"changed payload","channel":"phone","outcome":"reached"}');raise exception 'conflicting replay accepted';exception when others then if sqlerrm<>'verification_idempotency_conflict' then raise;end if;end;
 begin perform public.staff_verification_action('93000000-0000-4000-8000-000000000001',gen_random_uuid(),'{"action":"confirm","expectedRevision":0,"note":"stale tab"}');raise exception 'stale version accepted';exception when others then if sqlerrm<>'verification_changed' then raise;end if;end;
 x:=public.staff_verification_action('93000000-0000-4000-8000-000000000001','93700000-0000-4000-8000-000000000002','{"action":"confirm","expectedRevision":1,"note":"Phone and address verified by staff."}');
 if x->>'status'<>'confirmed' or x->>'verification_status'<>'admin_approved' then raise exception 'confirmation state invalid';end if;
end $$;
reset role;
do $$ begin
 if (select count(*) from public.cod_verifications where order_id='93000000-0000-4000-8000-000000000001')<>2 then raise exception 'attempt duplicated';end if;
 if not exists(select 1 from public.cod_verifications where order_id='93000000-0000-4000-8000-000000000001' and staff_action='confirm' and verified_by=(select admin_id from p9_state) and verified_at is not null) then raise exception 'verified staff/time missing';end if;
 if (select reserved from public.inventory_balances where variant_id='93400000-0000-4000-8000-000000000001')<>2 then raise exception 'confirmation consumed/released stock';end if;
 if (select cod_settlement_status from public.orders where id='93000000-0000-4000-8000-000000000001')<>'not_due' then raise exception 'confirmation collected COD';end if;
end $$;
set local role authenticated;
select public.staff_verification_action('93000000-0000-4000-8000-000000000001','93700000-0000-4000-8000-000000000003','{"action":"cancel","expectedRevision":2,"note":"Customer requested cancellation before dispatch."}');
select public.staff_verification_action('93000000-0000-4000-8000-000000000001','93700000-0000-4000-8000-000000000003','{"action":"cancel","expectedRevision":2,"note":"Customer requested cancellation before dispatch."}');
select public.staff_verification_action('93000000-0000-4000-8000-000000000002','93700000-0000-4000-8000-000000000004','{"action":"reject","expectedRevision":0,"note":"Customer declined the pending order."}');
reset role;
do $$ begin
 if (select reserved from public.inventory_balances where variant_id='93400000-0000-4000-8000-000000000001')<>0 or (select on_hand from public.inventory_balances where variant_id='93400000-0000-4000-8000-000000000001')<>5 then raise exception 'stock release wrong';end if;
 if (select count(*) from public.inventory_ledger where reference_id='93000000-0000-4000-8000-000000000001' and event_type='reservation_release')<>1 then raise exception 'stock released more than once';end if;
 if (select count(*) from public.notifications where entity_id='93000000-0000-4000-8000-000000000001' and event_key='order.cancelled')<>1 then raise exception 'customer notification duplicated';end if;
 if (select verification_status from public.orders where id='93000000-0000-4000-8000-000000000002')<>'rejected' then raise exception 'rejection state wrong';end if;
 if (select count(*) from public.audit_logs where entity_id in ('93000000-0000-4000-8000-000000000001','93000000-0000-4000-8000-000000000002') and action like 'cod.verification.%')<>4 then raise exception 'audit dedupe failed';end if;
end $$;
-- Customer still sees safe owned status/history; private notes remain inaccessible.
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"93100000-0000-4000-8000-000000000001","role":"authenticated","session_id":"93200000-0000-4000-8000-000000000001"}',true);
do $$ begin if (select status from public.orders where id='93000000-0000-4000-8000-000000000001')<>'cancelled' then raise exception 'customer status missing';end if;
 if (select count(*) from public.order_status_history where order_id='93000000-0000-4000-8000-000000000001')<>2 then raise exception 'customer progress missing';end if;
 begin perform note from public.order_status_history;raise exception 'history note exposed';exception when insufficient_privilege then null;end;
end $$;
reset role;
update auth.sessions set not_after=now()-interval '1 second' where id='93200000-0000-4000-8000-000000000002';
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',(select admin_id from p9_state),'role','authenticated','session_id','93200000-0000-4000-8000-000000000002')::text,true);
do $$ begin begin perform public.staff_verification_queue();raise exception 'revoked admin session accepted';exception when others then if sqlerrm<>'authentication_required' then raise;end if;end;end $$;
reset role;
select 'PASS: staff/session/metadata boundaries, queue/detail, contact replay/conflict, stale revision, confirmation actor/time, cancellation stock once, rejection, private notes, safe customer status, notifications and audit' as result;
rollback;
