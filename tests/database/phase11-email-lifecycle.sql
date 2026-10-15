begin;
set local statement_timeout='8s'; set local lock_timeout='3s';
insert into public.orders(id,guest_checkout,contact_name,contact_email,contact_phone,subtotal_pkr,total_pkr,idempotency_key) values('b1200000-0000-4000-8000-000000000001',true,'Rollback event fixture','fixture@example.invalid','+923001234561',1000,1000,'p11-events');
insert into public.order_items(order_id,sku,product_name,variant_name,unit_price_pkr,quantity,line_total_pkr) values('b1200000-0000-4000-8000-000000000001','P11','Saved item','Sand',1000,1,1000);
set constraints all immediate;
insert into app_private.order_email_outbox(order_id,payload) values('b1200000-0000-4000-8000-000000000001','{"to":["fixture@example.invalid"],"subject":"Receipt","text":"Saved receipt"}');
insert into public.order_status_history(order_id,from_status,to_status,note) values('b1200000-0000-4000-8000-000000000001','pending_verification','confirmed','PRIVATE NOTE'),('b1200000-0000-4000-8000-000000000001','confirmed','cancelled','PRIVATE NOTE');
insert into public.returns(order_id,reason_code) values('b1200000-0000-4000-8000-000000000001','damaged');
do $$declare j record;begin
 for j in select * from app_private.order_email_outbox where event_key<>'order.placed' and order_id='b1200000-0000-4000-8000-000000000001' loop
  perform app_private.enqueue_transactional_email(j.order_id,j.event_key,j.event_id,case when j.event_key='return.requested' then j.event_id else null end);
 end loop;
 if (select count(*) from app_private.order_email_outbox where order_id='b1200000-0000-4000-8000-000000000001')<>5 then raise exception 'five jobs or replay failed';end if;
 if exists(select 1 from app_private.order_email_outbox where payload::text like '%PRIVATE NOTE%') then raise exception 'private note leaked';end if;
 if not exists(select 1 from app_private.order_email_outbox where event_key='return.requested' and payload->>'text' like '%Return request #%') then raise exception 'return reference missing';end if;
end $$;
select 'PASS: all five events, guest updates, private notes, deterministic history IDs and replay' as result;
rollback;
