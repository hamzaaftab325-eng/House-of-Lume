-- New account contracts only. No business records or return policy are seeded.
alter table public.returns add column request_id uuid, add column request_hash text;
alter table public.returns add constraint returns_request_pair_check check ((request_id is null and request_hash is null) or (request_id is not null and request_hash ~ '^[a-f0-9]{64}$'));
create unique index returns_customer_request_idx on public.returns(customer_id, request_id) where request_id is not null;
-- Validate session revocation against Auth, not only JWT expiry. The lookup stays private.
create function app_private.account_session_valid() returns boolean
language sql stable security definer set search_path = '' as $$
 select coalesce(auth.uid() is not null and auth.jwt()->>'is_anonymous' is distinct from 'true' and exists (
   select 1 from auth.sessions s join auth.users u on u.id=s.user_id where u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false) and s.id=nullif(auth.jwt()->>'session_id','')::uuid and s.user_id=auth.uid() and (s.not_after is null or s.not_after>now())
 ),false);
$$;
revoke all on function app_private.account_session_valid() from public,anon;
grant execute on function app_private.account_session_valid() to authenticated;
create function public.account_session_valid() returns boolean language sql stable security invoker set search_path = '' as $$ select app_private.account_session_valid(); $$;
revoke all on function public.account_session_valid() from public,anon;
grant execute on function public.account_session_valid() to authenticated;

create function app_private.account_customer_id() returns uuid
language plpgsql stable security invoker set search_path = '' as $$
declare v_id uuid;
begin
  if not app_private.account_session_valid() then raise exception 'authentication_required'; end if;
  select id into v_id from public.customers where user_id = auth.uid() and status = 'active';
  if v_id is null then raise exception 'authentication_required'; end if;
  return v_id;
end;
$$;
revoke all on function app_private.account_customer_id() from public, anon;
grant execute on function app_private.account_customer_id() to authenticated;

create function public.account_save_profile(p_name text, p_phone text, p_whatsapp text) returns void
language plpgsql security invoker set search_path = '' as $$
declare v_customer uuid := app_private.account_customer_id();
begin
  if length(btrim(p_name)) not between 2 and 100 or p_name is null
    or length(coalesce(p_phone,'')) > 20 or length(coalesce(p_whatsapp,'')) > 20
    or (coalesce(p_phone,'') <> '' and p_phone !~ '^\+?[0-9][0-9 ()-]{8,19}$')
    or (coalesce(p_whatsapp,'') <> '' and p_whatsapp !~ '^\+?[0-9][0-9 ()-]{8,19}$') then raise exception 'invalid_profile'; end if;
  perform id from public.customers where id = v_customer for update;
  update public.profiles set display_name = btrim(p_name), phone = nullif(btrim(p_phone),''), whatsapp_number = nullif(btrim(p_whatsapp),'') where id = auth.uid();
  if not found then raise exception 'account_unavailable'; end if;
  update public.customers set full_name = btrim(p_name), phone = nullif(btrim(p_phone),''), whatsapp_number = nullif(btrim(p_whatsapp),'') where id = v_customer;
end;
$$;

create function public.account_save_address(p_values jsonb) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare v_customer uuid := app_private.account_customer_id(); v_id uuid := nullif(p_values->>'id','')::uuid; v_default boolean := coalesce((p_values->>'default')::boolean,false);
begin
  if jsonb_typeof(p_values) <> 'object' or p_values is null
    or coalesce(length(btrim(p_values->>'recipient')),0) not between 2 and 100
    or coalesce(p_values->>'phone','') !~ '^\+?[0-9][0-9 ()-]{8,19}$'
    or coalesce(length(btrim(p_values->>'line1')),0) not between 5 and 200
    or coalesce(length(btrim(p_values->>'city')),0) not between 2 and 80
    or coalesce(length(p_values->>'label'),0) > 50 or coalesce(length(p_values->>'line2'),0) > 200
    or coalesce(p_values->>'postalCode','') !~ '^([0-9]{5})?$'
    or coalesce(p_values->>'province','') not in ('Punjab','Sindh','Khyber Pakhtunkhwa','Balochistan','Islamabad Capital Territory','Gilgit-Baltistan','Azad Jammu and Kashmir') then raise exception 'invalid_address'; end if;
  perform id from public.customers where id = v_customer for update;
  if v_id is not null and not exists(select 1 from public.customer_addresses where id = v_id and customer_id = v_customer) then raise exception 'address_unavailable'; end if;
  if v_id is null and (select count(*) from public.customer_addresses where customer_id = v_customer) >= 50 then raise exception 'address_limit'; end if;
  if not exists(select 1 from public.customer_addresses where customer_id = v_customer) then v_default := true; end if;
  if v_default then update public.customer_addresses set is_default = false where customer_id = v_customer and is_default; end if;
  if v_id is null then
    insert into public.customer_addresses(customer_id,label,recipient_name,phone,address_line1,address_line2,city,province,postal_code,is_default)
    values(v_customer,nullif(p_values->>'label',''),btrim(p_values->>'recipient'),p_values->>'phone',btrim(p_values->>'line1'),nullif(p_values->>'line2',''),btrim(p_values->>'city'),p_values->>'province',nullif(p_values->>'postalCode',''),v_default) returning id into v_id;
  else
    update public.customer_addresses set label=nullif(p_values->>'label',''),recipient_name=btrim(p_values->>'recipient'),phone=p_values->>'phone',address_line1=btrim(p_values->>'line1'),address_line2=nullif(p_values->>'line2',''),city=btrim(p_values->>'city'),province=p_values->>'province',postal_code=nullif(p_values->>'postalCode',''),is_default=v_default where id=v_id and customer_id=v_customer;
  end if;
  if not exists(select 1 from public.customer_addresses where customer_id=v_customer and is_default) then
    update public.customer_addresses set is_default=true where id=(select id from public.customer_addresses where customer_id=v_customer order by created_at,id limit 1);
  end if;
  return v_id;
end;
$$;

create function public.account_delete_address(p_id uuid) returns void
language plpgsql security invoker set search_path = '' as $$
declare v_customer uuid := app_private.account_customer_id();
begin
  perform id from public.customers where id=v_customer for update;
  delete from public.customer_addresses where id=p_id and customer_id=v_customer;
  if not found then raise exception 'address_unavailable'; end if;
  if not exists(select 1 from public.customer_addresses where customer_id=v_customer and is_default) then
    update public.customer_addresses set is_default=true where id=(select id from public.customer_addresses where customer_id=v_customer order by created_at,id limit 1);
  end if;
end;
$$;

create function public.account_save_preferences(p_email_marketing boolean) returns void
language plpgsql security invoker set search_path = '' as $$
declare v_customer uuid := app_private.account_customer_id();
begin
  if p_email_marketing is null then raise exception 'invalid_preference'; end if;
  perform id from public.customers where id=v_customer for update;
  if exists(select 1 from public.notification_preferences where customer_id=v_customer) then
    update public.notification_preferences set email_marketing=p_email_marketing where customer_id=v_customer;
  else
    insert into public.notification_preferences(customer_id,email_marketing) values(v_customer,p_email_marketing);
  end if;
  update public.customers set marketing_email_opt_in=p_email_marketing where id=v_customer;
end;
$$;

-- Controlled creation of returns is the only elevated account write. It derives ownership
-- from Auth, locks the order, validates a published merchant policy and checks every item.
create function app_private.account_request_return(p_order_id uuid,p_reason text,p_detail text,p_items jsonb,p_request_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_customer uuid; v_order public.orders%rowtype; v_policy jsonb; v_return uuid; v_entry jsonb; v_item public.order_items%rowtype; v_quantity integer; v_used integer; v_window integer; v_existing public.returns%rowtype; v_hash text;
begin
  if not app_private.account_session_valid() then raise exception 'authentication_required'; end if;
  select id into v_customer from public.customers where user_id=auth.uid() and status='active';
  if v_customer is null then raise exception 'authentication_required'; end if;
  if p_request_id is null then raise exception 'invalid_request_id'; end if;
  v_hash := encode(extensions.digest(jsonb_build_object('order',p_order_id,'reason',p_reason,'detail',p_detail,'items',p_items)::text,'sha256'),'hex');
  select * into v_existing from public.returns where customer_id=v_customer and request_id=p_request_id;
  if found then
    if v_existing.request_hash <> v_hash then raise exception 'request_replay_mismatch'; end if;
    return v_existing.id;
  end if;
  select value into v_policy from public.system_settings where key='returns.policy' and is_public;
  if v_policy is null or v_policy->>'enabled' is distinct from 'true' or jsonb_typeof(v_policy->'reason_codes') is distinct from 'array' or jsonb_typeof(v_policy->'excluded_product_ids') is distinct from 'array' or coalesce(length(v_policy->>'refund_procedure'),0) not between 10 and 2000 then raise exception 'return_policy_unavailable'; end if;
  v_window := (v_policy->>'window_days')::integer;
  if v_window is null or v_window not between 1 and 365 or not (v_policy->'reason_codes' ? p_reason) then raise exception 'invalid_return'; end if;
  select * into v_order from public.orders where id=p_order_id and customer_id=v_customer for update;
  if not found or v_order.status <> 'delivered' or v_order.delivered_at is null or v_order.delivered_at > now() or v_order.delivered_at < now() - make_interval(days=>v_window) then raise exception 'order_not_returnable'; end if;
  select * into v_existing from public.returns where customer_id=v_customer and request_id=p_request_id;
  if found then
    if v_existing.request_hash <> v_hash then raise exception 'request_replay_mismatch'; end if;
    return v_existing.id;
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 30 or coalesce(length(p_detail),0)>2000 then raise exception 'invalid_return'; end if;
  if (select count(distinct value->>'id') from jsonb_array_elements(p_items)) <> jsonb_array_length(p_items) then raise exception 'duplicate_return_item'; end if;
  insert into public.returns(order_id,customer_id,reason_code,reason_detail,request_id,request_hash) values(p_order_id,v_customer,p_reason,nullif(p_detail,''),p_request_id,v_hash) returning id into v_return;
  for v_entry in select value from jsonb_array_elements(p_items) loop
    v_quantity := (v_entry->>'quantity')::integer;
    select * into v_item from public.order_items where id=(v_entry->>'id')::uuid and order_id=p_order_id for update;
    if not found or v_quantity is null or v_quantity not between 1 and 99 or v_policy->'excluded_product_ids' ? v_item.product_id::text then raise exception 'invalid_return_item'; end if;
    select coalesce(sum(ri.quantity),0) into v_used from public.return_items ri join public.returns r on r.id=ri.return_id where ri.order_item_id=v_item.id and r.status not in ('rejected','cancelled');
    if v_used + v_quantity > v_item.quantity then raise exception 'return_quantity_exceeded'; end if;
    insert into public.return_items(return_id,order_item_id,quantity) values(v_return,v_item.id,v_quantity);
  end loop;
  return v_return;
end;
$$;
revoke all on function app_private.account_request_return(uuid,text,text,jsonb,uuid) from public,anon;
grant execute on function app_private.account_request_return(uuid,text,text,jsonb,uuid) to authenticated;
create function public.account_request_return(p_order_id uuid,p_reason text,p_detail text,p_items jsonb,p_request_id uuid) returns uuid
language sql security invoker set search_path = '' as $$ select app_private.account_request_return(p_order_id,p_reason,p_detail,p_items,p_request_id); $$;

revoke all on function public.account_save_profile(text,text,text), public.account_save_address(jsonb), public.account_delete_address(uuid), public.account_save_preferences(boolean), public.account_request_return(uuid,text,text,jsonb,uuid) from public,anon;
grant execute on function public.account_save_profile(text,text,text), public.account_save_address(jsonb), public.account_delete_address(uuid), public.account_save_preferences(boolean), public.account_request_return(uuid,text,text,jsonb,uuid) to authenticated;

-- Reuse the existing on_auth_user_created/on_auth_user_updated triggers for customer
-- provisioning and verified-email synchronization; no duplicate trigger is introduced.

-- RLS controls the owner; column grants also prevent direct Data API reads of staff-only fields.
revoke select on public.orders, public.order_status_history, public.returns, public.notifications from authenticated;
grant select (id,order_number,customer_id,guest_checkout,contact_name,contact_email,contact_phone,contact_whatsapp,status,currency,subtotal_pkr,discount_pkr,shipping_pkr,tax_pkr,total_pkr,customer_note,placed_at,confirmed_at,cancelled_at,delivered_at,created_at,updated_at) on public.orders to authenticated;
grant select (id,order_id,from_status,to_status,created_at) on public.order_status_history to authenticated;
grant select (id,return_number,order_id,customer_id,status,reason_code,reason_detail,resolution,requested_at,approved_at,received_at,completed_at,created_at,updated_at) on public.returns to authenticated;
grant select (id,recipient_user_id,recipient_customer_id,event_key,title,body,priority,entity_type,entity_id,read_at,created_at) on public.notifications to authenticated;

-- Restrictive policies supplement existing ownership policies; logged-out JWTs cannot
-- use direct Data API access to bypass the application session check.
do $$
declare v_table text;
begin
 foreach v_table in array array['profiles','customers','customer_addresses','orders','order_items','order_addresses','order_status_history','notifications','notification_preferences','returns','return_items','carts','cart_items','wishlists','wishlist_items'] loop
   execute format('create policy account_live_session_guard on public.%I as restrictive for all to authenticated using ((select app_private.account_session_valid())) with check ((select app_private.account_session_valid()))',v_table);
 end loop;
end;
$$;

create or replace function app_private.commerce_customer_id() returns uuid language plpgsql stable security definer set search_path = '' as $$
declare v_id uuid;
begin
 if auth.uid() is null then return null; end if;
 if not app_private.account_session_valid() then raise exception 'authentication_required'; end if;
 select c.id into v_id from public.customers c where c.user_id=auth.uid() and c.status='active' limit 1;
 return v_id;
end;
$$;
