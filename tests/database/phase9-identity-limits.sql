begin;
insert into auth.users(id,email,email_confirmed_at) values('98500000-0000-4000-8000-000000000001','p9-hour-customer@example.invalid',now());
insert into public.orders(customer_id,contact_name,contact_phone,subtotal_pkr,total_pkr,idempotency_key)
 select id,'Rollback identity quota','+92300'||lpad(i::text,7,'0'),1000+i,1000+i,'p9-account-hour-'||i from public.customers cross join generate_series(1001,1003) i where user_id='98500000-0000-4000-8000-000000000001';
do $$ begin begin
 insert into public.orders(customer_id,contact_name,contact_phone,subtotal_pkr,total_pkr,idempotency_key)
 select id,'Rotated phone customer','+923009999999',1000,1000,'p9-account-hour-fourth' from public.customers where user_id='98500000-0000-4000-8000-000000000001';
 raise exception 'customer rotated-phone quota bypass';exception when others then if sqlerrm<>'checkout_order_limit' then raise;end if;end;end $$;
insert into public.orders(guest_checkout,contact_name,contact_phone,subtotal_pkr,total_pkr,idempotency_key,placed_at)
 select true,'Daily rollback fixture','+923008888888',1000+i,1000+i,'p9-day-'||i,now()-interval '2 hours'-i*interval '1 minute' from generate_series(1,5) i;
do $$ begin begin insert into public.orders(guest_checkout,contact_name,contact_phone,subtotal_pkr,total_pkr,idempotency_key) values(true,'Daily sixth','03008888888',2000,2000,'p9-day-sixth');raise exception 'daily quota bypass';exception when others then if sqlerrm<>'checkout_order_limit' then raise;end if;end;end $$;
select 'PASS: signed-in customer hourly cap despite changing phone; rolling 24-hour normalized phone cap' as result;
rollback;
