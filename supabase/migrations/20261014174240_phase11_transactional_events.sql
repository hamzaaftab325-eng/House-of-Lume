-- Trusted transaction producers only. No public enqueue or resend endpoint.
alter table app_private.order_email_outbox drop constraint order_email_outbox_order_id_key;
alter table app_private.order_email_outbox add column event_key text not null default 'order.placed', add column event_id uuid, add column recipient_hash text;
update app_private.order_email_outbox set event_id=order_id,recipient_hash=encode(extensions.digest(lower(payload->'to'->>0),'sha256'),'hex');
alter table app_private.order_email_outbox alter column event_id set not null, alter column recipient_hash set not null;
alter table app_private.order_email_outbox add constraint email_event_supported check(event_key in ('order.placed','order.verification_required','order.confirmed','order.cancelled','return.requested'));
create index order_email_outbox_order_idx on app_private.order_email_outbox(order_id);
create unique index order_email_event_job_idx on app_private.order_email_outbox(event_key,event_id,recipient_hash);
create table app_private.email_event_receipts (
 event_key text not null,event_id uuid not null,recipient_hash text not null,template_version text not null,
 job_id uuid references app_private.order_email_outbox(id) on delete set null deferrable initially deferred,
 created_at timestamptz not null default now(),primary key(event_key,event_id,recipient_hash)
);
create index email_event_receipts_job_idx on app_private.email_event_receipts(job_id) where job_id is not null;
alter table app_private.email_event_receipts enable row level security;
revoke all on app_private.email_event_receipts from public,anon,authenticated;
insert into app_private.email_event_receipts(event_key,event_id,recipient_hash,template_version,job_id) select event_key,event_id,recipient_hash,template_version,id from app_private.order_email_outbox;
