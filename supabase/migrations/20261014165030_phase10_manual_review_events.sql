-- A staff-created review flag is also an operational event; revisions identify each episode.
create function app_private.manual_review_notice() returns trigger language plpgsql security definer set search_path='' as $$begin
 if new.review_status='pending' and old.review_status is distinct from new.review_status then
  perform app_private.emit_notification('order.review_required',pg_catalog.md5(new.id::text||':'||new.verification_revision::text)::uuid,'staff','order',new.id);
 end if;return new;
end;$$;
revoke all on function app_private.manual_review_notice() from public,anon,authenticated;
create trigger orders_manual_review_notice after update of review_status on public.orders for each row execute function app_private.manual_review_notice();
alter policy notification_preferences_own_all on public.notification_preferences using (
 app_private.account_session_valid() and exists(select 1 from public.customers c where c.id=customer_id and c.user_id=auth.uid() and c.status='active')
) with check (
 app_private.account_session_valid() and exists(select 1 from public.customers c where c.id=customer_id and c.user_id=auth.uid() and c.status='active')
);
