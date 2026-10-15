begin;
set local statement_timeout='8s'; set local lock_timeout='3s';
insert into auth.sessions(id,user_id,created_at,not_after) values('b1500000-0000-4000-8000-000000000001','13ea3052-462e-473f-b023-346a163eaf3a',now(),now()+interval '1 hour');
insert into public.orders(id,guest_checkout,contact_name,contact_email,contact_phone,subtotal_pkr,total_pkr,idempotency_key) values('b1500000-0000-4000-8000-000000000002',true,'Rollback staff email fixture','fixture@example.invalid','+923001234563',1000,1000,'p11-staff-workflow');
set constraints all immediate;
select set_config('request.jwt.claims','{"sub":"13ea3052-462e-473f-b023-346a163eaf3a","role":"authenticated","session_id":"b1500000-0000-4000-8000-000000000001"}',true);
select public.staff_verification_action('b1500000-0000-4000-8000-000000000002','b1500000-0000-4000-8000-000000000003','{"action":"confirm","expectedRevision":0,"note":"PRIVATE VERIFICATION NOTE"}');
select public.staff_verification_action('b1500000-0000-4000-8000-000000000002','b1500000-0000-4000-8000-000000000003','{"action":"confirm","expectedRevision":0,"note":"PRIVATE VERIFICATION NOTE"}');
select public.staff_verification_action('b1500000-0000-4000-8000-000000000002','b1500000-0000-4000-8000-000000000004','{"action":"cancel","expectedRevision":1,"note":"PRIVATE CANCELLATION NOTE"}');
do $$declare x jsonb;begin
 if (select count(*) from app_private.order_email_outbox where order_id='b1500000-0000-4000-8000-000000000002')<>3 then raise exception 'staff workflow jobs missing/duplicated';end if;
 if exists(select 1 from app_private.order_email_outbox where order_id='b1500000-0000-4000-8000-000000000002' and payload::text like '%PRIVATE%') then raise exception 'staff note leaked';end if;
 x:=public.notification_operations();
 if exists(select 1 from jsonb_array_elements(x->'jobs') j where j->>'event' is null or j->>'version' is null or j ? 'payload' or j ? 'recipient_hash') then raise exception 'operations event/privacy contract failed';end if;
end $$;
select 'PASS: authenticated staff confirm/replay/cancel jobs, note privacy and operations event/version contract' as result;
rollback;
