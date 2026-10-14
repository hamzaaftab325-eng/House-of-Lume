-- No SMTP calls and no persistent fixture data. Never emit the worker capability.
begin;
create temporary table gmail_test_state(secret text, claim jsonb);
insert into gmail_test_state(secret) select decrypted_secret from vault.decrypted_secrets where name='dwellune_order_worker_secret';
grant select,update on gmail_test_state to anon;
insert into public.orders(id,guest_checkout,contact_name,contact_email,contact_phone,subtotal_pkr,total_pkr,idempotency_key)
 values('92000000-0000-4000-8000-000000000001',true,'Rollback SMTP fixture','fixture@example.invalid','+923001234567',1000,1000,'rollback-gmail-fixture');
insert into app_private.order_email_outbox(order_id,payload)
 values('92000000-0000-4000-8000-000000000001','{"to":["fixture@example.invalid"],"subject":"Rollback SMTP fixture","text":"Not sent"}');
set local role anon;
do $$ declare s text;x jsonb;begin
 select secret into s from gmail_test_state;
 begin perform public.order_email_worker('wrong','{"action":"claim"}');raise exception 'wrong token accepted';exception when others then if sqlerrm<>'worker_unauthorized' then raise;end if;end;
 begin perform count(*) from app_private.order_email_outbox;raise exception 'private queue exposed';exception when insufficient_privilege then null;end;
 perform public.order_email_worker(s,'{"action":"health","ok":true}');
 x:=public.order_email_worker(s,'{"action":"claim"}');
 if x->'job'->>'order_id'<>'92000000-0000-4000-8000-000000000001' then raise exception 'claim missing';end if;
 update gmail_test_state set claim=x->'job';
 if public.order_email_worker(s,'{"action":"claim"}')->'job'<>'null'::jsonb then raise exception 'duplicate claim';end if;
 begin perform public.order_email_worker(s,jsonb_build_object('action','finish','id',x->'job'->>'id','lease',gen_random_uuid(),'result','sent','message_id','test-message'));raise exception 'foreign lease accepted';exception when others then if sqlerrm<>'worker_lease_invalid' then raise;end if;end;
 perform public.order_email_worker(s,jsonb_build_object('action','finish','id',x->'job'->>'id','lease',x->'job'->>'lease','result','retry'));
end $$;
reset role;
do $$ begin if not exists(select 1 from app_private.order_email_outbox where order_id='92000000-0000-4000-8000-000000000001' and status='pending' and attempt_count=1 and next_attempt_at>now()) then raise exception 'retry/backoff missing';end if;end $$;
update app_private.order_email_outbox set next_attempt_at=now() where order_id='92000000-0000-4000-8000-000000000001';
set local role anon;
update gmail_test_state set claim=public.order_email_worker(secret,'{"action":"claim"}')->'job';
select public.order_email_worker(secret,jsonb_build_object('action','finish','id',claim->>'id','lease',claim->>'lease','result','uncertain')) from gmail_test_state;
do $$ declare s text;begin select secret into s from gmail_test_state;if public.order_email_worker(s,'{"action":"claim"}')->'job'<>'null'::jsonb then raise exception 'uncertain send retried';end if;end $$;
reset role;
do $$ begin if not exists(select 1 from app_private.order_email_outbox where order_id='92000000-0000-4000-8000-000000000001' and status='failed' and last_error_code='smtp_uncertain') then raise exception 'uncertain state missing';end if;
 if (select count(*) from public.notifications where entity_id='92000000-0000-4000-8000-000000000001' and event_key='order.email_failed')<>1 then raise exception 'operator alert missing/duplicated';end if;end $$;
-- Expired worker lease also requires review, not a resend.
update app_private.order_email_outbox set status='sending',next_attempt_at=now()-interval '1 minute' where order_id='92000000-0000-4000-8000-000000000001';
set local role anon;
select public.order_email_worker(secret,'{"action":"claim"}') from gmail_test_state;
reset role;
do $$ begin if (select status from app_private.order_email_outbox where order_id='92000000-0000-4000-8000-000000000001')<>'failed' then raise exception 'expired send was retried';end if;end $$;
-- A fresh explicit acceptance can be finalized exactly once.
update app_private.order_email_outbox set status='pending',next_attempt_at=now() where order_id='92000000-0000-4000-8000-000000000001';
set local role anon;
update gmail_test_state set claim=public.order_email_worker(secret,'{"action":"claim"}')->'job';
select public.order_email_worker(secret,jsonb_build_object('action','finish','id',claim->>'id','lease',claim->>'lease','result','sent','message_id','smtp-test-message')) from gmail_test_state;
do $$ declare s text;x jsonb;begin select secret,claim into s,x from gmail_test_state;
 begin perform public.order_email_worker(s,jsonb_build_object('action','finish','id',x->>'id','lease',x->>'lease','result','sent','message_id','smtp-test-message'));raise exception 'duplicate finalize accepted';exception when others then if sqlerrm<>'worker_lease_invalid' then raise;end if;end;
 perform public.order_email_worker(s,'{"action":"health","ok":false}');
 if not (public.order_email_worker(s,'{"action":"claim"}')->>'verify_due')::boolean then raise exception 'unhealthy smtp gate ignored';end if;
end $$;
reset role;
do $$ begin if not exists(select 1 from app_private.order_email_outbox where order_id='92000000-0000-4000-8000-000000000001' and status='sent' and provider_message_id='smtp-test-message') then raise exception 'acceptance not saved';end if;
 if public.checkout_release_ready() then raise exception 'checkout gate opened';end if;end $$;
select 'PASS: capability/RLS, claim dedupe, lease ownership, bounded backoff, uncertain/crashed send, operator alert dedupe, accepted-once, health and closed checkout' as result;
rollback;
