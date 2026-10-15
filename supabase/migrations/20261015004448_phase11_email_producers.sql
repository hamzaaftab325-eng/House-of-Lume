create function app_private.verification_event_email() returns trigger language plpgsql security definer set search_path='' as $$begin
 if new.status='pending_verification' and exists(select 1 from public.orders where id=new.id and status='pending_verification') then perform app_private.enqueue_transactional_email(new.id,'order.verification_required',new.id);end if;return new;
end;$$;
create function app_private.status_event_email() returns trigger language plpgsql security definer set search_path='' as $$begin
 if new.to_status is distinct from new.from_status and new.to_status in ('confirmed','cancelled') then perform app_private.enqueue_transactional_email(new.order_id,'order.'||new.to_status,new.id);end if;return new;
end;$$;
create function app_private.return_event_email() returns trigger language plpgsql security definer set search_path='' as $$begin
 if new.status='requested' then perform app_private.enqueue_transactional_email(new.order_id,'return.requested',new.id,new.id);end if;return new;
end;$$;
revoke all on function app_private.verification_event_email(),app_private.status_event_email(),app_private.return_event_email() from public,anon,authenticated;
-- Deferred until complete snapshots and companion in-app notices exist. Rollback cancels all jobs.
create constraint trigger orders_verification_email after insert on public.orders deferrable initially deferred for each row execute function app_private.verification_event_email();
create constraint trigger order_history_email after insert on public.order_status_history deferrable initially deferred for each row execute function app_private.status_event_email();
create constraint trigger return_request_email after insert on public.returns deferrable initially deferred for each row execute function app_private.return_event_email();
create table app_private.email_attempt_events(id bigint generated always as identity primary key,job_id uuid not null references app_private.order_email_outbox(id) on delete cascade,status text not null,attempt int not null,error_code text,created_at timestamptz not null default now());
create index email_attempt_events_job_idx on app_private.email_attempt_events(job_id,created_at);
alter table app_private.email_attempt_events enable row level security;
revoke all on app_private.email_attempt_events from public,anon,authenticated;
create function app_private.log_email_attempt() returns trigger language plpgsql security definer set search_path='' as $$begin
 if tg_op='INSERT' or new.status is distinct from old.status or new.attempt_count is distinct from old.attempt_count or new.last_error_code is distinct from old.last_error_code then
  insert into app_private.email_attempt_events(job_id,status,attempt,error_code) values(new.id,new.status,new.attempt_count,new.last_error_code);
 end if;return new;
end;$$;
revoke all on function app_private.log_email_attempt() from public,anon,authenticated;
create trigger order_email_attempt_log after insert or update of status,attempt_count,last_error_code on app_private.order_email_outbox for each row execute function app_private.log_email_attempt();

