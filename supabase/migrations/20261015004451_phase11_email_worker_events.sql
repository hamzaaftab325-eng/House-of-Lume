create or replace function app_private.order_email_worker(p_secret text,p_input jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_secret text; v_action text; v_lease uuid; v_result text; r record;
begin
 select decrypted_secret into v_secret from vault.decrypted_secrets where name='dwellune_order_worker_secret' limit 1;
 if length(coalesce(v_secret,''))<32 or p_secret is null or
    extensions.digest(p_secret,'sha256') is distinct from extensions.digest(v_secret,'sha256')
 then raise exception 'worker_unauthorized'; end if;
 if jsonb_typeof(p_input) is distinct from 'object' then raise exception 'invalid_worker_input'; end if;
 v_action:=p_input->>'action';
 -- Serialize housekeeping/claim/finalize without locking across the SMTP network operation.
 perform pg_advisory_xact_lock(734211,9);
 update app_private.order_email_worker_state set last_run_at=now() where singleton;
 if v_action='health' then
  if jsonb_typeof(p_input->'ok') is distinct from 'boolean' then raise exception 'invalid_worker_input'; end if;
  update app_private.order_email_worker_state set verified_at=case when (p_input->>'ok')::boolean then now() else null end,
   last_error_code=case when (p_input->>'ok')::boolean then null else 'smtp_verification_failed' end where singleton;
  return jsonb_build_object('ok',true);
 elsif v_action='claim' then
  -- A worker crash after claiming may have sent the message: never auto-retry expired sends.
  update app_private.order_email_outbox set status='failed',last_error_code='smtp_uncertain'
   where status='sending' and next_attempt_at<now();
  update app_private.order_email_outbox set status='failed',last_error_code='retry_window_exceeded'
   where status='pending' and (attempt_count>=5 or created_at<now()-interval '22 hours');
 elsif v_action='finish' then
  v_result:=p_input->>'result';
  if v_result not in ('sent','retry','failed','uncertain') or v_result is null then raise exception 'invalid_worker_input'; end if;
  select * into r from app_private.order_email_outbox where id=(p_input->>'id')::uuid
   and worker_lease=(p_input->>'lease')::uuid and status='sending' for update;
  if not found then raise exception 'worker_lease_invalid'; end if;
  if v_result='sent' and coalesce(length(p_input->>'message_id'),0) not between 1 and 255 then raise exception 'invalid_worker_input'; end if;
  update app_private.order_email_outbox set
   status=case when v_result='sent' then 'sent' when v_result='retry' and attempt_count<5 and created_at>now()-interval '22 hours' then 'pending' else 'failed' end,
   sent_at=case when v_result='sent' then now() else null end,
   provider_message_id=case when v_result='sent' then p_input->>'message_id' else null end,
   last_error_code=case when v_result='sent' then null when v_result='uncertain' then 'smtp_uncertain' when v_result='retry' then 'smtp_temporary_rejection' else 'smtp_rejected' end,
   next_attempt_at=now()+make_interval(mins=>least(60,power(2,attempt_count)::int)),request_id=null
  where id=r.id;
  update public.notification_deliveries d set provider='gmail_smtp',status=e.status::public.notification_delivery_status,
   sent_at=e.sent_at,provider_message_id=e.provider_message_id,attempt_count=e.attempt_count,
   failed_at=case when e.status='failed' then now() else null end,last_error_code=e.last_error_code
  from app_private.order_email_outbox e where e.id=r.id and d.notification_id=e.notification_id and d.channel='email';
 else raise exception 'invalid_worker_input'; end if;
 -- Include guests: alert the operator even when there is no customer notification record.
 for r in select e.* from app_private.order_email_outbox e where e.status='failed' loop
  insert into public.notifications(recipient_user_id,event_key,title,body,priority,entity_type,entity_id,data)
   select s.user_id,'order.email_failed','Order email requires attention',
    case when r.last_error_code='smtp_uncertain' then 'The order is saved. Email acceptance is uncertain; review the sender mailbox before resending.' else 'The order is saved, but transactional email sending failed.' end,
    'high','order',r.order_id,jsonb_build_object('href','/crm','email_job_id',r.id,'email_event',r.event_key)
   from public.staff_profiles s where s.is_active and s.role_slug='super_admin'
   and not exists(select 1 from public.notifications n where n.event_key='order.email_failed' and n.entity_id=r.order_id and n.recipient_user_id=s.user_id and n.data->>'email_job_id'=r.id::text);
  update public.notification_deliveries set provider='gmail_smtp',status='failed',failed_at=coalesce(failed_at,now()),
   attempt_count=r.attempt_count,last_error_code=r.last_error_code where notification_id=r.notification_id and channel='email';
 end loop;
 if v_action<>'claim' then return jsonb_build_object('ok',true); end if;
 if not exists(select 1 from app_private.order_email_worker_state where verified_at>now()-interval '1 hour') then
  return jsonb_build_object('job',null,'verify_due',true);
 end if;
 select * into r from app_private.order_email_outbox where status='pending' and next_attempt_at<=now()
  order by created_at,id limit 1 for update skip locked;
 if not found then return jsonb_build_object('job',null,'verify_due',false); end if;
 v_lease:=gen_random_uuid();
 update app_private.order_email_outbox set status='sending',worker_lease=v_lease,attempt_count=attempt_count+1,
  first_attempt_at=coalesce(first_attempt_at,now()),next_attempt_at=now()+interval '5 minutes',request_id=null where id=r.id;
 update public.notification_deliveries set provider='gmail_smtp',attempt_count=r.attempt_count+1 where notification_id=r.notification_id and channel='email';
 return jsonb_build_object('job',jsonb_build_object('id',r.id,'order_id',r.order_id,'lease',v_lease,'payload',r.payload),'verify_due',false);
end; $$;

