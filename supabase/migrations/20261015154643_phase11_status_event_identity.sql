-- History IDs are bigint; event IDs use a stable, namespaced UUID derived from them.
create or replace function app_private.status_event_email() returns trigger language plpgsql security definer set search_path='' as $$begin
 if new.to_status is distinct from new.from_status and new.to_status in ('confirmed','cancelled') then perform app_private.enqueue_transactional_email(new.order_id,'order.'||new.to_status,md5('order-status:'||new.order_id::text||':'||new.id::text)::uuid);end if;return new;
end;$$;
