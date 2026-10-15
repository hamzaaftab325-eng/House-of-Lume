create function app_private.prepare_event_email() returns trigger language plpgsql security definer set search_path='' as $$
declare v_claim uuid;
begin
 if jsonb_array_length(new.payload->'to')<>1 or coalesce(new.payload->'to'->>0,'') !~ '^[^[:space:]<>@]+@[^[:space:]<>@]+\.[^[:space:]<>@]+$' then raise exception 'invalid_email_recipient';end if;
 new.event_id:=coalesce(new.event_id,new.order_id);
 new.recipient_hash:=encode(extensions.digest(lower(new.payload->'to'->>0),'sha256'),'hex');
 new.template_version:='v2';
 new.payload:=new.payload||jsonb_build_object('event',new.event_key,'version',new.template_version);
 insert into app_private.email_event_receipts(event_key,event_id,recipient_hash,template_version,job_id) values(new.event_key,new.event_id,new.recipient_hash,new.template_version,new.id) on conflict do nothing returning job_id into v_claim;
 if v_claim is null then return null;end if;return new;
end;$$;
revoke all on function app_private.prepare_event_email() from public,anon,authenticated;
create trigger order_email_prepare_event before insert on app_private.order_email_outbox for each row execute function app_private.prepare_event_email();
