-- No real SMTP or persistent fixture data. All changes roll back.
begin;
create temporary table p11_state(customer uuid,first_payload jsonb,verification_job uuid,confirm_event bigint);
insert into p11_state(customer) select id from public.customers where user_id='13ea3052-462e-473f-b023-346a163eaf3a';
do $$begin if not exists(select 1 from p11_state) then raise exception 'owner customer missing';end if;end $$;
insert into public.orders(id,customer_id,contact_name,contact_email,contact_phone,subtotal_pkr,shipping_pkr,total_pkr,idempotency_key,internal_note)
select 'b1100000-0000-4000-8000-000000000001',customer,'Rollback email customer','email-fixture@example.invalid','+923001234567',2400,250,2650,'rollback-phase11-email','PRIVATE STAFF NOTE' from p11_state;
insert into public.order_items(order_id,sku,product_name,variant_name,unit_price_pkr,quantity,line_total_pkr)
values('b1100000-0000-4000-8000-000000000001','P11-FIXTURE','Ceramic <vase>','Sand',2400,1,2400);
insert into app_private.order_email_outbox(order_id,payload)
values('b1100000-0000-4000-8000-000000000001','{"to":["email-fixture@example.invalid"],"subject":"Receipt","text":"Saved placement snapshot"}');
set constraints all immediate;
do $$declare j record;begin
 select * into j from app_private.order_email_outbox where order_id='b1100000-0000-4000-8000-000000000001' and event_key='order.verification_required';
 if j.id is null or j.payload->>'event'<>'order.verification_required' or j.payload->>'version'<>'v2' then raise exception 'verification job/version missing';end if;
 if j.payload->>'text' not like '%Ceramic <vase>%' or j.payload->>'text' not like '%Due on delivery: PKR 2650%' or j.payload::text like '%PRIVATE STAFF NOTE%' then raise exception 'snapshot or privacy invalid';end if;
 if not exists(select 1 from public.notification_deliveries where notification_id=j.notification_id and channel='email' and status='pending') then raise exception 'customer email delivery missing';end if;
 update p11_state set first_payload=j.payload,verification_job=j.id;
 perform app_private.enqueue_transactional_email(j.order_id,j.event_key,j.event_id);
 if (select count(*) from app_private.order_email_outbox where order_id=j.order_id)<>2 then raise exception 'event replay duplicated';end if;
end $$;

select 'PASS: saved snapshot/customer delivery/version/replay' as result;
rollback;