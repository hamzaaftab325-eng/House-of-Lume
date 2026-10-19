begin;
create temporary table p9c_state(admin_id uuid,policy_input jsonb,policy_result jsonb);
insert into p9c_state(admin_id) select user_id from app_private.store_owner where singleton;
grant all on p9c_state to authenticated;
insert into auth.sessions(id,user_id,created_at,not_after) select '97000000-0000-4000-8000-000000000001',admin_id,now(),now()+interval '1 hour' from p9c_state;
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',(select admin_id from p9c_state),'role','authenticated','session_id','97000000-0000-4000-8000-000000000001')::text,true);
update p9c_state set policy_input=jsonb_build_object('expectedRevision',(public.staff_verification_policy()->>'revision')::int,'note','Rollback policy verification','values','{"verificationRequired":false,"highValuePkr":25000,"duplicateWindowHours":24,"failedDeliveryCount":2,"failedDeliveryLookbackDays":180,"maxOrders24h":5,"maxOrdersHour":3}'::jsonb);
update p9c_state set policy_result=public.staff_verification_policy('97100000-0000-4000-8000-000000000001',policy_input);
do $$ declare s p9c_state%rowtype;begin select * into s from p9c_state;
 if s.policy_result is distinct from public.staff_verification_policy('97100000-0000-4000-8000-000000000001',s.policy_input) then raise exception 'policy replay mismatch';end if;
 begin perform public.staff_verification_policy('97100000-0000-4000-8000-000000000001',jsonb_set(s.policy_input,'{values,highValuePkr}','30000'));raise exception 'policy conflicting replay accepted';exception when others then if sqlerrm<>'verification_idempotency_conflict' then raise;end if;end;
 begin perform public.staff_verification_policy(gen_random_uuid(),s.policy_input);raise exception 'stale policy accepted';exception when others then if sqlerrm<>'verification_changed' then raise;end if;end;
 begin perform public.staff_verification_policy(gen_random_uuid(),jsonb_set(s.policy_input,'{values,maxOrdersHour}','6'));raise exception 'hour/day mismatch accepted';exception when others then if sqlerrm<>'invalid_verification_policy' then raise;end if;end;
end $$;
reset role;
do $$ begin if (select value from public.system_settings where key='cod.verification_required')<>'false'::jsonb or (select value from public.system_settings where key='checkout.max_orders_per_day')<>'5'::jsonb then raise exception 'policy mirrors mismatch';end if;end $$;
-- High value, normalized-phone duplicates and real historical delivery outcomes.
insert into public.orders(id,guest_checkout,contact_name,contact_phone,status,verification_status,subtotal_pkr,total_pkr,idempotency_key)
 values('97200000-0000-4000-8000-000000000001',true,'Rollback high value','+923001234567','confirmed','admin_approved',30000,30000,'p9c-high'),
 ('97200000-0000-4000-8000-000000000002',true,'Rollback duplicate first','+923001234568','pending_verification','pending',1000,1000,'p9c-dup-1'),
 ('97200000-0000-4000-8000-000000000003',true,'Rollback duplicate second','03001234568','confirmed','admin_approved',1000,1000,'p9c-dup-2');
insert into public.orders(id,guest_checkout,contact_name,contact_phone,status,subtotal_pkr,total_pkr,idempotency_key,placed_at) values
 ('97200000-0000-4000-8000-000000000004',true,'Historical failure fixture','+923001234569','delivery_failed',5000,5000,'p9c-history-1',now()-interval '7 days'),
 ('97200000-0000-4000-8000-000000000005',true,'Historical RTO fixture','+923001234569','rto_received',5000,5000,'p9c-history-2',now()-interval '14 days');
insert into public.orders(id,guest_checkout,contact_name,contact_phone,status,subtotal_pkr,total_pkr,idempotency_key) values('97200000-0000-4000-8000-000000000006',true,'Rollback history review','+923001234569','confirmed',1000,1000,'p9c-history-review');
do $$ begin
 if not exists(select 1 from public.orders where id='97200000-0000-4000-8000-000000000001' and review_status='pending' and status='pending_verification' and review_flags @> '[{"code":"high_value","threshold":25000}]') then raise exception 'high-value override missing';end if;
 if not exists(select 1 from public.orders where id='97200000-0000-4000-8000-000000000003' and contact_phone='+923001234568' and review_flags @> '[{"code":"possible_duplicate","count":1}]') then raise exception 'normalized duplicate missing';end if;
 if not exists(select 1 from public.orders where id='97200000-0000-4000-8000-000000000006' and review_flags @> '[{"code":"failed_delivery_history","count":2}]') then raise exception 'real history signal missing';end if;
 begin update public.orders set status='processing' where id='97200000-0000-4000-8000-000000000001';raise exception 'reviewed fulfillment bypass accepted';exception when others then if sqlerrm<>'manual_review_required' then raise;end if;end;
end $$;
set local role authenticated;
do $$ declare x jsonb;begin
 x:=public.staff_verification_queue('review');if jsonb_array_length(x->'items')<>3 then raise exception 'manual queue mismatch';end if;
 begin perform public.staff_verification_action('97200000-0000-4000-8000-000000000001',gen_random_uuid(),'{"action":"confirm","expectedRevision":0,"note":"bypass pending review"}');raise exception 'review confirmation bypass';exception when others then if sqlerrm<>'manual_review_required' then raise;end if;end;
 begin perform app_private.staff_verification_action_base('97200000-0000-4000-8000-000000000001',gen_random_uuid(),'{"action":"confirm","expectedRevision":0,"note":"bypass base"}');raise exception 'private base exposed';exception when insufficient_privilege then null;end;
 x:=public.staff_verification_action('97200000-0000-4000-8000-000000000001','97300000-0000-4000-8000-000000000001','{"action":"clear_review","expectedRevision":0,"note":"Customer identity and high-value order reviewed."}');
 if x is distinct from public.staff_verification_action('97200000-0000-4000-8000-000000000001','97300000-0000-4000-8000-000000000001','{"action":"clear_review","expectedRevision":0,"note":"Customer identity and high-value order reviewed."}') then raise exception 'review replay mismatch';end if;
 perform public.staff_verification_action('97200000-0000-4000-8000-000000000001','97300000-0000-4000-8000-000000000002','{"action":"confirm","expectedRevision":1,"note":"Verified after explicit review clearance."}');
 x:=public.staff_verification_detail('97200000-0000-4000-8000-000000000001');if x->'review'->>'status'<>'cleared' or x->'review'->>'reviewed_by'<>(select admin_id::text from p9c_state) or x->'review'->>'reviewed_at' is null or jsonb_array_length(x->'review'->'flags')<>1 then raise exception 'clear actor/snapshot missing';end if;
 perform public.staff_verification_action('97200000-0000-4000-8000-000000000002','97300000-0000-4000-8000-000000000003','{"action":"request_review","expectedRevision":0,"note":"Staff found a contact detail needing review."}');
 perform public.staff_verification_action('97200000-0000-4000-8000-000000000003','97300000-0000-4000-8000-000000000004','{"action":"reject","expectedRevision":0,"note":"Customer declined the duplicate order."}');
end $$;
reset role;
do $$ begin if (select review_status from public.orders where id='97200000-0000-4000-8000-000000000003')<>'closed' then raise exception 'rejection did not close review';end if;end $$;
-- Hourly limit includes cancelled orders, and applies before another order is committed.
insert into public.orders(id,guest_checkout,contact_name,contact_phone,subtotal_pkr,total_pkr,idempotency_key) values('97200000-0000-4000-8000-000000000007',true,'Third same phone','+923001234568',2000,2000,'p9c-hour-third');
do $$ begin begin insert into public.orders(guest_checkout,contact_name,contact_phone,subtotal_pkr,total_pkr,idempotency_key) values(true,'Fourth same phone','00923001234568',2000,2000,'p9c-hour-fourth');raise exception 'normalized hourly limit bypass';exception when others then if sqlerrm<>'checkout_order_limit' then raise;end if;end;end $$;
select 'PASS: policy auth/replay/conflict/stale/bounds, normalized duplicate/high-value/failure signals, flagged verification override, blocked confirmation/fulfillment/base bypass, staff clearance snapshot, manual flag/rejection, and hourly normalized-phone limit' as result;
rollback;
