-- Inbox ownership is separate from commerce administrator access.
alter table public.notifications add column audience text check (audience in ('customer','staff'));
update public.notifications n set audience=case when recipient_customer_id is null and exists(select 1 from public.staff_profiles s where s.user_id=n.recipient_user_id) then 'staff' else 'customer' end;
alter table public.notifications alter column audience set not null;
create function app_private.notification_audience() returns trigger language plpgsql security definer set search_path='' as $$begin
 if new.audience is null then new.audience:=case when new.recipient_customer_id is null and exists(select 1 from public.staff_profiles where user_id=new.recipient_user_id) then 'staff' else 'customer' end;end if;return new;
end;$$;
revoke all on function app_private.notification_audience() from public,anon,authenticated;
create trigger notifications_audience before insert on public.notifications for each row execute function app_private.notification_audience();
create index notifications_customer_feed_idx on public.notifications(recipient_customer_id,audience,created_at desc,id desc);
create index notifications_user_feed_idx on public.notifications(recipient_user_id,audience,created_at desc,id desc);
create function app_private.notification_owned(p_audience text,p_user uuid,p_customer uuid) returns boolean language sql stable security definer set search_path='' as $$
 select app_private.account_session_valid() and
 case when p_audience='staff' then p_user=auth.uid() and app_private.is_super_admin()
 else exists(select 1 from public.customers where user_id=auth.uid() and status='active') and (p_user=auth.uid() or exists(select 1 from public.customers where id=p_customer and user_id=auth.uid() and status='active')) end;
$$;
revoke all on function app_private.notification_owned(text,uuid,uuid) from public,anon;
grant execute on function app_private.notification_owned(text,uuid,uuid) to authenticated;
alter policy notifications_own_read on public.notifications using (app_private.notification_owned(audience,recipient_user_id,recipient_customer_id));
alter policy notifications_own_mark_read on public.notifications using (app_private.notification_owned(audience,recipient_user_id,recipient_customer_id)) with check (app_private.notification_owned(audience,recipient_user_id,recipient_customer_id));
-- Read controls use server time and guarded RPCs; clients cannot reset timestamps directly.
revoke update(read_at) on public.notifications from authenticated;
create function app_private.notification_guard(p_audience text) returns void language plpgsql security definer set search_path='' as $$begin
 if auth.uid() is null or not app_private.account_session_valid() then raise exception 'authentication_required';end if;
 if p_audience is null or p_audience not in ('customer','staff') then raise exception 'invalid_notification_input';end if;
 if p_audience='staff' then
  perform 1 from public.staff_profiles where user_id=auth.uid() and is_active and role_slug='super_admin' for share;
  if not found then raise exception 'staff_access_required';end if;
 elsif not exists(select 1 from public.customers where user_id=auth.uid() and status='active') then raise exception 'account_unavailable';end if;
end;$$;
revoke all on function app_private.notification_guard(text) from public,anon,authenticated;
create function app_private.notification_category(p_event text,p_entity text) returns text language sql immutable set search_path='' as $$
 select case when p_event like '%verification%' or p_event='order.review_required' then 'verification'
 when p_entity='order' then 'orders' when p_entity in ('return','rto') then 'returns'
 when p_event like 'inventory.%' then 'inventory' when p_entity='product' then 'products'
 when p_entity in ('account','customer','profile') then 'account' else 'operations' end;
$$;
revoke all on function app_private.notification_category(text,text) from public,anon,authenticated;
create function app_private.notification_link(p_audience text,p_entity text,p_id uuid) returns text language plpgsql stable security definer set search_path='' as $$declare v text;begin
 if p_entity='order' and exists(select 1 from public.orders where id=p_id and (p_audience='staff' or app_private.owns_order(id))) then return case when p_audience='staff' then '/crm/verification/' else '/account/orders/' end||p_id;end if;
 if p_entity='return' and p_audience='customer' then select '/account/orders/'||r.order_id into v from public.returns r where r.id=p_id and app_private.owns_order(r.order_id);return v;end if;
 if p_entity='product' then select '/products/'||slug into v from public.products where id=p_id and status='active' and published_at<=now() and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$';return v;end if;
 if p_entity in ('account','customer','profile') and p_audience='customer' then return '/account';end if;
 return null;
end;$$;
revoke all on function app_private.notification_link(text,text,uuid) from public,anon,authenticated;
create function app_private.notification_unread(p_audience text) returns bigint language plpgsql security definer set search_path='' as $$declare v bigint;begin
 perform app_private.notification_guard(p_audience);
 select count(*) into v from public.notifications where audience=p_audience and read_at is null and app_private.notification_owned(audience,recipient_user_id,recipient_customer_id);return v;
end;$$;
create function app_private.notification_feed(p_audience text,p_read text default 'all',p_category text default 'all',p_priority text default 'all',p_before uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.notifications%rowtype;v_items jsonb;v_next uuid;v_cutoff timestamptz:=statement_timestamp();begin
 perform app_private.notification_guard(p_audience);
 if p_read is null or p_read not in ('all','unread') or p_category is null or p_category not in ('all','orders','verification','inventory','returns','products','account','operations') or p_priority is null or p_priority not in ('all','low','normal','high','critical') then raise exception 'invalid_notification_input';end if;
 if p_before is not null then select * into a from public.notifications where id=p_before and audience=p_audience and app_private.notification_owned(audience,recipient_user_id,recipient_customer_id);if not found then raise exception 'notification_cursor_unavailable';end if;end if;
 with matches as (
 select n.*,row_number() over(order by created_at desc,id desc) as position from public.notifications n
 where audience=p_audience and app_private.notification_owned(audience,recipient_user_id,recipient_customer_id)
 and (p_read='all' or read_at is null) and (p_category='all' or app_private.notification_category(event_key,entity_type)=p_category)
 and (p_priority='all' or priority::text=p_priority) and (p_before is null or (created_at,id)<(a.created_at,a.id))
 order by created_at desc,id desc limit 21
 ) select coalesce(jsonb_agg(jsonb_build_object('id',id,'title',title,'body',body,'priority',priority,'read_at',read_at,'created_at',created_at,'category',app_private.notification_category(event_key,entity_type),'href',app_private.notification_link(p_audience,entity_type,entity_id)) order by created_at desc,id desc) filter(where position<=20),'[]'),
 (array_agg(id order by position) filter(where position=20 and exists(select 1 from matches where position=21)))[1] into v_items,v_next from matches;
 return jsonb_build_object('items',v_items,'next_cursor',v_next,'unread',app_private.notification_unread(p_audience),'cutoff',v_cutoff);
end;$$;
create function app_private.notification_read(p_audience text,p_id uuid default null,p_cutoff timestamptz default null) returns jsonb language plpgsql security definer set search_path='' as $$begin
 perform app_private.notification_guard(p_audience);
 if (p_id is null)=(p_cutoff is null) or p_cutoff>statement_timestamp() then raise exception 'invalid_notification_input';end if;
 if p_id is not null and not exists(select 1 from public.notifications where id=p_id and audience=p_audience and app_private.notification_owned(audience,recipient_user_id,recipient_customer_id)) then raise exception 'notification_unavailable';end if;
 update public.notifications set read_at=clock_timestamp() where audience=p_audience and app_private.notification_owned(audience,recipient_user_id,recipient_customer_id) and read_at is null and ((p_id is not null and id=p_id) or (p_cutoff is not null and created_at<=p_cutoff));
 return jsonb_build_object('unread',app_private.notification_unread(p_audience));
end;$$;
revoke all on function app_private.notification_unread(text),app_private.notification_feed(text,text,text,text,uuid),app_private.notification_read(text,uuid,timestamptz) from public,anon;
grant execute on function app_private.notification_unread(text),app_private.notification_feed(text,text,text,text,uuid),app_private.notification_read(text,uuid,timestamptz) to authenticated;
create function public.notification_unread(p_audience text) returns bigint language sql security invoker set search_path='' as $$select app_private.notification_unread(p_audience);$$;
create function public.notification_feed(p_audience text,p_read text default 'all',p_category text default 'all',p_priority text default 'all',p_before uuid default null) returns jsonb language sql security invoker set search_path='' as $$select app_private.notification_feed(p_audience,p_read,p_category,p_priority,p_before);$$;
create function public.notification_read(p_audience text,p_id uuid default null,p_cutoff timestamptz default null) returns jsonb language sql security invoker set search_path='' as $$select app_private.notification_read(p_audience,p_id,p_cutoff);$$;
revoke all on function public.notification_unread(text),public.notification_feed(text,text,text,text,uuid),public.notification_read(text,uuid,timestamptz) from public,anon;
grant execute on function public.notification_unread(text),public.notification_feed(text,text,text,text,uuid),public.notification_read(text,uuid,timestamptz) to authenticated;
