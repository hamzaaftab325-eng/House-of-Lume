begin;
set local statement_timeout='8s'; set local lock_timeout='3s';
insert into public.orders(id,guest_checkout,contact_name,contact_email,contact_phone,subtotal_pkr,total_pkr,idempotency_key) values('b1300000-0000-4000-8000-000000000001',true,'Rollback boundary fixture','fixture@example.invalid','+923001234562',1000,1000,'p11-boundaries');
set constraints all immediate;
insert into app_private.checkout_receipts(order_id,guest_hash,request_hash) values('b1300000-0000-4000-8000-000000000001',repeat('a',64),'p11-boundary-receipt');
insert into app_private.order_email_outbox(order_id,payload) values('b1300000-0000-4000-8000-000000000001','{"to":["fixture@example.invalid"],"subject":"Receipt","text":"Saved receipt"}');
do $$declare x jsonb;j record;begin
 x:=app_private.checkout_confirmation('b1300000-0000-4000-8000-000000000001',repeat('a',64));
 if x->>'email_status'<>'pending' then raise exception 'receipt with multiple jobs failed';end if;
 begin perform app_private.checkout_confirmation('b1300000-0000-4000-8000-000000000001',repeat('b',64));raise exception 'foreign guest accepted';exception when others then if sqlerrm<>'order_unavailable' then raise;end if;end;
 begin perform app_private.enqueue_transactional_email('b1300000-0000-4000-8000-000000000001','order.shipped',gen_random_uuid());raise exception 'deferred event accepted';exception when others then if sqlerrm<>'email_event_inactive' then raise;end if;end;
 select * into j from app_private.order_email_outbox where order_id='b1300000-0000-4000-8000-000000000001' and event_key='order.verification_required';
 update app_private.order_email_outbox set status='sending',attempt_count=1 where id=j.id;
 update app_private.order_email_outbox set status='failed',last_error_code='smtp_uncertain' where id=j.id;
 if (select count(*) from app_private.email_attempt_events where job_id=j.id)<>3 then raise exception 'attempt log missing';end if;
 insert into app_private.email_event_receipts(event_key,event_id,recipient_hash,template_version) values(j.event_key,'b1400000-0000-4000-8000-000000000001',j.recipient_hash,'v2');
 perform app_private.enqueue_transactional_email(j.order_id,j.event_key,'b1400000-0000-4000-8000-000000000001');
 if exists(select 1 from app_private.order_email_outbox where event_key=j.event_key and event_id='b1400000-0000-4000-8000-000000000001') then raise exception 'archived event resurrected';end if;
end $$;
set local role authenticated;
do $$begin
 begin perform app_private.enqueue_transactional_email('b1300000-0000-4000-8000-000000000001','order.cancelled',gen_random_uuid());raise exception 'customer enqueue accepted';exception when insufficient_privilege then null;end;
 begin perform count(*) from app_private.email_event_receipts;raise exception 'receipt privacy breached';exception when insufficient_privilege then null;end;
 begin perform count(*) from app_private.email_attempt_events;raise exception 'attempt privacy breached';exception when insufficient_privilege then null;end;
end $$;
reset role;
select 'PASS: guest confirmation/isolation, deferred event denial, retained receipt without job, attempt log, private queue boundaries' as result;
rollback;
