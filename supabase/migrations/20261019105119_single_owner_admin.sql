-- One owner account. Preserve commerce data and legacy API compatibility.
-- Apply transactionally through the migration runner; never rerun reconciled history.
set local lock_timeout = '5s';
set local statement_timeout = '60s';
lock table public.staff_profiles in access exclusive mode;
do $$ begin
 if (select count(*) from public.staff_profiles where is_active and role_slug='super_admin')<>1
 or exists(select 1 from public.staff_profiles where is_active and role_slug<>'super_admin')
 then raise exception 'single_owner_preflight_failed'; end if;
end $$;

create table app_private.store_owner (
 singleton boolean primary key default true check (singleton),
 user_id uuid not null unique references auth.users(id) on delete restrict,
 access_valid_after timestamptz not null default '-infinity',
 created_at timestamptz not null default now()
);
insert into app_private.store_owner(user_id,access_valid_after)
select user_id,access_valid_after from public.staff_profiles where is_active and role_slug='super_admin';
alter table app_private.store_owner enable row level security;
revoke all on app_private.store_owner from public,anon,authenticated;

create function app_private.is_owner() returns boolean language sql stable security definer set search_path='' as $$
 select app_private.account_session_valid() and exists(
  select 1 from app_private.store_owner o
  join auth.users u on u.id=o.user_id
  join auth.sessions s on s.user_id=o.user_id and s.id::text=(auth.jwt()->>'session_id')
  where o.singleton and o.user_id=auth.uid() and s.created_at>=o.access_valid_after
   and (u.banned_until is null or u.banned_until<=now())
 );
$$;
revoke all on function app_private.is_owner() from public,anon;
grant execute on function app_private.is_owner() to authenticated;

create function app_private.owner_require() returns void language plpgsql security definer set search_path='' as $$ begin
 if not app_private.account_session_valid() then raise exception 'authentication_required'; end if;
 perform 1 from app_private.store_owner where singleton and user_id=auth.uid() for share;
 if not found or not app_private.is_owner() then raise exception 'staff_access_required'; end if;
end $$;
revoke all on function app_private.owner_require() from public,anon,authenticated;

-- Retain this policy helper name so existing RLS policies remain valid.
create or replace function app_private.is_super_admin() returns boolean language sql stable security definer set search_path='' as $$ select app_private.is_owner(); $$;

create function app_private.owner_context() returns jsonb language plpgsql volatile security definer set search_path='' as $$ declare result jsonb; begin
 perform app_private.owner_require();
 select jsonb_build_object('userId',u.id,'email',u.email) into result
 from app_private.store_owner o join auth.users u on u.id=o.user_id where o.singleton and o.user_id=auth.uid();
 return result;
end $$;
revoke all on function app_private.owner_context() from public,anon;
grant execute on function app_private.owner_context() to authenticated;
create function public.owner_context() returns jsonb language sql volatile security invoker set search_path='' as $$ select app_private.owner_context(); $$;
revoke all on function public.owner_context() from public,anon;
grant execute on function public.owner_context() to authenticated;

alter table app_private.staff_verification_receipts rename to admin_verification_receipts;


-- Preserve the existing business transaction; replace access/recipient dependencies only.
CREATE OR REPLACE FUNCTION app_private.checkout_place_order(p_guest_hash text, p_key uuid, p_revision text, p_input jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_customer uuid; v_scope text; v_key text; v_hash text; v_existing public.orders%rowtype; v_cart uuid; v_quote jsonb; v_totals jsonb; v_address jsonb; v_order uuid; v_item uuid; v_discount uuid; v_notification uuid; v_required boolean; v_limit int; v_phone text; v_email text; v_text text; r record; h record;
begin
 perform app_private.commerce_lock();
 if p_key is null or p_revision is null or p_revision !~ '^[a-f0-9]{64}$' or p_input is null or jsonb_typeof(p_input)<>'object' then raise exception 'invalid_checkout'; end if;
 if auth.uid() is not null then v_customer:=app_private.commerce_customer_id(); if v_customer is null then raise exception 'authentication_required'; end if; v_scope:='customer:'||v_customer;
 else if not app_private.commerce_valid_guest_hash(p_guest_hash) then raise exception 'guest_cart_token_required'; end if; v_scope:='guest:'||p_guest_hash; end if;
 v_key:=encode(extensions.digest(v_scope||':'||p_key::text,'sha256'),'hex');
 v_hash:=encode(extensions.digest(p_input::text||':'||p_revision,'sha256'),'hex');
 select * into v_existing from public.orders where idempotency_key=v_key;
 if v_existing.id is not null then
  if not exists(select 1 from app_private.checkout_receipts where order_id=v_existing.id and request_hash=v_hash) then raise exception 'idempotency_conflict'; end if;
  return app_private.checkout_confirmation(v_existing.id,p_guest_hash);
 end if;
 if not app_private.checkout_release_ready() then raise exception 'checkout_not_open'; end if;
 if exists(select 1 from jsonb_object_keys(p_input) k where k not in ('name','email','phone','address','savedAddressId','notes','terms'))
 or length(trim(coalesce(p_input->>'name',''))) not between 2 and 100 or length(coalesce(p_input->>'notes',''))>1000 or p_input->'terms' is distinct from 'true'::jsonb then raise exception 'invalid_checkout'; end if;
 v_phone:=regexp_replace(p_input->>'phone','[ ()-]','','g');
 if v_phone is null or v_phone !~ '^(\+92|0092|92|0)3[0-9]{9}$' then raise exception 'invalid_checkout'; end if;
 v_phone:='+92'||right(v_phone,10);
 v_email:=trim(p_input->>'email');
 if v_customer is not null then select email::text into v_email from auth.users where id=auth.uid(); end if;
 if v_email is null or length(v_email)>254 or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'invalid_checkout'; end if;
 v_address:=p_input->'address';
 if p_input->>'savedAddressId' is not null then
  select jsonb_build_object('line1',address_line1,'line2',coalesce(address_line2,''),'city',city,'province',province,'postalCode',coalesce(postal_code,''),'country','PK') into v_address from public.customer_addresses where id=(p_input->>'savedAddressId')::uuid and customer_id=v_customer for share;
  if v_address is null then raise exception 'saved_address_unavailable'; end if;
 end if;
 if length(trim(coalesce(v_address->>'line1',''))) not between 5 and 200 or length(coalesce(v_address->>'line2',''))>200 or coalesce(v_address->>'postalCode','') !~ '^([0-9]{5})?$' then raise exception 'invalid_delivery_address'; end if;
 perform app_private.checkout_hour_limit(v_customer,case when v_customer is null then p_guest_hash else null end,v_phone);
 v_limit:=greatest(1,least(20,coalesce((select (value #>> '{}')::int from public.system_settings where key='checkout.max_orders_per_day'),5)));
 if (select count(*) from public.orders where placed_at>now()-interval '24 hours' and contact_phone=v_phone)>=v_limit
 or (select count(*) from app_private.checkout_receipts where created_at>now()-interval '24 hours' and ((v_customer is not null and customer_id=v_customer) or (v_customer is null and guest_hash=p_guest_hash)))>=v_limit then raise exception 'checkout_order_limit'; end if;
 -- Prevent catalogue/rule edits between canonical validation and purchase snapshots.
 lock table public.products,public.product_variants,public.discounts,public.discount_rules,public.shipping_rules,public.shipping_zones,public.system_settings,public.inventory_locations in share mode;
 v_quote:=app_private.checkout_quote(p_guest_hash,v_address);
 if v_quote->>'revision'<>p_revision then raise exception 'quote_changed'; end if;
 if (v_quote->>'contains_test_product')::boolean then raise exception 'test_product_not_orderable'; end if;
 v_cart:=(v_quote->'cart'->>'cart_id')::uuid; v_totals:=v_quote->'cart'->'quote';
 -- Acquire missing/expired holds atomically, then transfer them without incrementing reserved twice.
 for r in select * from public.cart_items where cart_id=v_cart order by variant_id loop perform app_private.commerce_set_cart_quantity(v_cart,r.variant_id,r.quantity); end loop;
 select discount_id into v_discount from public.carts where id=v_cart;
 v_required:=coalesce((select (value #>> '{}')::boolean from public.system_settings where key='cod.verification_required'),true);
 insert into public.orders(customer_id,guest_checkout,contact_name,contact_email,contact_phone,status,verification_status,subtotal_pkr,discount_pkr,shipping_pkr,total_pkr,shipping_rule_id,discount_id,idempotency_key,customer_note)
 values(v_customer,v_customer is null,trim(p_input->>'name'),v_email,v_phone,case when v_required then 'pending_verification'::public.order_status else 'confirmed'::public.order_status end,case when v_required then 'pending'::public.verification_status else 'admin_approved'::public.verification_status end,(v_totals->>'subtotal_pkr')::bigint,(v_totals->>'discount_pkr')::bigint,(v_totals->>'shipping_pkr')::bigint,(v_totals->>'total_pkr')::bigint,(v_quote->'delivery'->>'rule_id')::uuid,v_discount,v_key,nullif(trim(p_input->>'notes'),'')) returning id into v_order;
 select status='pending_verification' into v_required from public.orders where id=v_order;
 if not v_required then update public.orders set confirmed_at=now() where id=v_order; end if;
 for r in select ci.*,pv.product_id,pv.sku,pv.title,pv.price_pkr,pv.track_inventory,p.name,pv.attributes from public.cart_items ci join public.product_variants pv on pv.id=ci.variant_id join public.products p on p.id=pv.product_id where ci.cart_id=v_cart order by ci.variant_id loop
  insert into public.order_items(order_id,product_id,variant_id,sku,product_name,variant_name,variant_snapshot,unit_price_pkr,quantity,line_total_pkr) values(v_order,r.product_id,r.variant_id,r.sku,r.name,r.title,jsonb_build_object('attributes',r.attributes,'track_inventory',r.track_inventory),r.price_pkr,r.quantity,r.price_pkr*r.quantity) returning id into v_item;
  for h in select * from public.inventory_reservations where cart_item_id=r.id and status='active' for update loop
   insert into public.order_inventory_reservations(order_id,order_item_id,variant_id,location_id,source_cart_reservation_id,quantity) values(v_order,v_item,h.variant_id,h.location_id,h.id,h.quantity);
   update public.inventory_reservations set status='converted',released_at=now(),release_reason='Transferred to COD order '||v_order where id=h.id;
  end loop;
 end loop;
 insert into public.order_addresses(order_id,recipient_name,phone,address_line1,address_line2,city,province,postal_code) values(v_order,trim(p_input->>'name'),v_phone,v_address->>'line1',nullif(v_address->>'line2',''),trim(v_address->>'city'),v_address->>'province',nullif(v_address->>'postalCode',''));
 insert into public.order_status_history(order_id,to_status,note,changed_by) select v_order,status,'COD order placed; totals and inventory validated',auth.uid() from public.orders where id=v_order;
 if v_required then insert into public.cod_verifications(order_id,attempt_number,method,status,note) values(v_order,1,'admin','pending','Awaiting operator verification; no outbound verification message sent'); end if;
 if v_discount is not null then insert into public.discount_redemptions(discount_id,order_id,customer_id,amount_pkr) values(v_discount,v_order,v_customer,(v_totals->>'discount_pkr')::bigint); end if;
 insert into app_private.checkout_receipts(order_id,customer_id,guest_hash,request_hash) values(v_order,v_customer,case when v_customer is null then p_guest_hash else null end,v_hash);
 if v_customer is not null then
  insert into public.notifications(recipient_customer_id,event_key,title,body,entity_type,entity_id,data) values(v_customer,'order.placed','Order received','Your Cash on Delivery order has been received.','order',v_order,jsonb_build_object('href','/account/orders/'||v_order)) returning id into v_notification;
  insert into public.notification_deliveries(notification_id,channel,status,provider) values(v_notification,'email','pending','gmail_smtp');
 end if;
 insert into public.notifications(recipient_user_id,event_key,title,body,priority,entity_type,entity_id,data) select user_id,'order.placed','New COD order','A new Cash on Delivery order awaits processing.','high','order',v_order,jsonb_build_object('href','/crm','order_id',v_order) from app_private.store_owner where singleton;
 select 'DWELLUNE — Order '||order_number||E'\n\nWe have received your Cash on Delivery order. '||case when v_required then 'It is awaiting verification.' else 'It is confirmed.' end||E'\n\n' into v_text from public.orders where id=v_order;
 for r in select * from public.order_items where order_id=v_order order by created_at,id loop v_text:=v_text||r.product_name||' / '||r.variant_name||' × '||r.quantity||' — PKR '||r.line_total_pkr||E'\n'; end loop;
 v_text:=v_text||E'\nSubtotal: PKR '||(v_totals->>'subtotal_pkr')||E'\nDiscount: PKR '||(v_totals->>'discount_pkr')||E'\nDelivery: PKR '||(v_totals->>'shipping_pkr')||E'\nDue on delivery: PKR '||(v_totals->>'total_pkr')||E'\n\nNo online payment is required. Keep your order number for support.\n';
 insert into app_private.order_email_outbox(order_id,notification_id,payload) select v_order,v_notification,jsonb_build_object('to',jsonb_build_array(v_email),'subject','DWELLUNE — Order '||order_number||' received','text',v_text) from public.orders where id=v_order;
 update public.carts set status='converted',converted_order_id=v_order,guest_token_hash=case when v_customer is null then encode(extensions.digest('converted:'||v_order::text,'sha256'),'hex') else null end,updated_at=now() where id=v_cart;
 return app_private.checkout_confirmation(v_order,p_guest_hash);
end; $function$;

-- Preserve the existing business transaction; replace access/recipient dependencies only.
CREATE OR REPLACE FUNCTION app_private.checkout_release_ready()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 select coalesce((select (value #>> '{}')::boolean from public.system_settings where key='checkout.orders_enabled'),false)
 and exists(select 1 from app_private.store_owner where singleton)
 and exists(select 1 from vault.decrypted_secrets where name='dwellune_order_worker_secret' and length(decrypted_secret)>=32)
 and exists(select 1 from app_private.order_email_worker_state where verified_at>now()-interval '24 hours');
$function$;

-- Preserve the existing business transaction; replace access/recipient dependencies only.
CREATE OR REPLACE FUNCTION app_private.emit_notification(p_key text, p_event uuid, p_audience text, p_entity text, p_entity_id uuid, p_customer uuid DEFAULT NULL::uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare t app_private.notification_types%rowtype;r record;v_claim uuid;v_notice uuid;v_allowed boolean;v_count int:=0;
begin
 select * into t from app_private.notification_types where event_key=p_key and audience=p_audience and state='active';if not found or p_event is null then raise exception 'notification_event_inactive';end if;
 for r in select user_id as id from app_private.store_owner s where p_audience='staff' and s.singleton
 union all select id from public.customers where p_audience='customer' and id=p_customer and status='active' loop
  v_allowed:=t.required or coalesce((select in_app_product_updates from public.notification_preferences where customer_id=r.id),false);
  v_claim:=null;
  insert into app_private.notification_event_receipts(event_key,event_id,audience,recipient_id,outcome) values(p_key,p_event,p_audience,r.id,case when v_allowed then 'recorded' else 'suppressed' end) on conflict do nothing returning recipient_id into v_claim;
  if v_claim is null or not v_allowed then continue;end if;
  insert into public.notifications(audience,recipient_user_id,recipient_customer_id,event_key,title,body,priority,entity_type,entity_id)
  values(p_audience,case when p_audience='staff' then r.id end,case when p_audience='customer' then r.id end,p_key,t.title,t.body,t.priority,p_entity,p_entity_id) returning id into v_notice;
  update app_private.notification_event_receipts set notification_id=v_notice where event_key=p_key and event_id=p_event and audience=p_audience and recipient_id=r.id;v_count:=v_count+1;
 end loop;return v_count;
end;$function$;

-- Preserve the existing business transaction; replace access/recipient dependencies only.
CREATE OR REPLACE FUNCTION app_private.notification_audience()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$begin
 if new.audience is null then new.audience:=case when new.recipient_customer_id is null and exists(select 1 from app_private.store_owner where singleton and user_id=new.recipient_user_id) then 'staff' else 'customer' end;end if;return new;
end;$function$;

-- Preserve the existing business transaction; replace access/recipient dependencies only.
CREATE OR REPLACE FUNCTION app_private.notification_guard(p_audience text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$begin
 if not app_private.account_session_valid() then raise exception 'authentication_required';end if;
 if p_audience is null or p_audience not in ('customer','staff') then raise exception 'invalid_notification_input';end if;
 if p_audience='staff' then perform app_private.owner_require();
 elsif not exists(select 1 from public.customers where user_id=auth.uid() and status='active') then raise exception 'account_unavailable';end if;
end;$function$;

-- Preserve the existing business transaction; replace access/recipient dependencies only.
CREATE OR REPLACE FUNCTION app_private.notification_operations(p_status text DEFAULT 'all'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$declare v_types jsonb;v_jobs jsonb;v_health jsonb;v_counts jsonb;begin
 perform app_private.owner_require();if p_status is null or p_status not in ('all','pending','sending','sent','failed') then raise exception 'invalid_notification_input';end if;
 select jsonb_agg(jsonb_build_object('key',event_key,'audience',audience,'category',category,'required',required,'state',state,'dependency',dependency) order by audience,event_key) into v_types from app_private.notification_types;
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'order_id',order_id,'event',event_key,'version',template_version,'status',status,'attempts',attempt_count,'error',last_error_code,'next_attempt',next_attempt_at,'created_at',created_at) order by created_at desc,id desc),'[]') into v_jobs from(select * from app_private.order_email_outbox where p_status='all' or status=p_status order by created_at desc,id desc limit 20) x;
 select jsonb_build_object('verified_at',verified_at,'last_run_at',last_run_at,'error',last_error_code) into v_health from app_private.order_email_worker_state where singleton;
 select jsonb_build_object('pending',count(*) filter(where status='pending'),'sending',count(*) filter(where status='sending'),'failed',count(*) filter(where status='failed'),'sent',count(*) filter(where status='sent')) into v_counts from app_private.order_email_outbox;
 return jsonb_build_object('types',v_types,'jobs',v_jobs,'health',v_health,'counts',v_counts);
end;$function$;

-- Preserve the existing business transaction; replace access/recipient dependencies only.
CREATE OR REPLACE FUNCTION app_private.notification_owned(p_audience text, p_user uuid, p_customer uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 select app_private.account_session_valid() and case when p_audience='staff' then p_user=auth.uid() and app_private.is_owner()
 else exists(select 1 from public.customers where user_id=auth.uid() and status='active') and (p_user=auth.uid() or exists(select 1 from public.customers where id=p_customer and user_id=auth.uid() and status='active')) end;
$function$;

-- Preserve the existing business transaction; replace access/recipient dependencies only.
CREATE OR REPLACE FUNCTION app_private.notify_cod_review()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$begin
 if new.review_status='pending' then
  insert into public.notifications(recipient_user_id,event_key,title,body,priority,entity_type,entity_id,data)
  select user_id,'order.review_required','COD order needs manual review','Review the recorded signals before confirming this order.','high','order',new.id,jsonb_build_object('href','/crm/verification/'||new.id) from app_private.store_owner where singleton;
 end if;return new;
end;$function$;

-- Preserve the existing business transaction; replace access/recipient dependencies only.
CREATE OR REPLACE FUNCTION app_private.order_email_worker(p_secret text, p_input jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
   from app_private.store_owner s where s.singleton
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
end; $function$;

-- Preserve the existing business transaction; replace access/recipient dependencies only.
CREATE OR REPLACE FUNCTION app_private.staff_verification_action(p_order_id uuid, p_request_id uuid, p_input jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare o public.orders%rowtype;r app_private.admin_verification_receipts%rowtype;v_hash text;v_action text;v_note text;v_result jsonb;
begin
 if auth.uid() is null or not app_private.account_session_valid() then raise exception 'authentication_required';end if;
 perform app_private.owner_require();
 perform 1 from app_private.store_owner where singleton and user_id=auth.uid() for share;
 if not found then raise exception 'staff_access_required';end if;
 perform app_private.commerce_lock();
 v_hash:=encode(extensions.digest(jsonb_build_object('order_id',p_order_id,'input',p_input)::text,'sha256'),'hex');
 select * into r from app_private.admin_verification_receipts where actor_user_id=auth.uid() and request_id=p_request_id;
 if found then if r.input_hash<>v_hash then raise exception 'verification_idempotency_conflict';end if;return r.result;end if;
 select * into o from public.orders where id=p_order_id for update;if not found then raise exception 'order_unavailable';end if;
 v_action:=p_input->>'action';
 if p_request_id is null or jsonb_typeof(p_input) is distinct from 'object' or v_action is null or v_action not in ('contact','confirm','reject','cancel','request_review','clear_review') then raise exception 'invalid_verification_input';end if;
 if v_action not in ('request_review','clear_review') then
  if v_action='confirm' and o.review_status='pending' then raise exception 'manual_review_required';end if;
  v_result:=app_private.staff_verification_action_base(p_order_id,p_request_id,p_input);
  select review_status into v_note from public.orders where id=p_order_id;
  v_result:=v_result||jsonb_build_object('review_status',v_note);
  update app_private.admin_verification_receipts set result=v_result where actor_user_id=auth.uid() and request_id=p_request_id;
  return v_result;
 end if;
 v_note:=trim(p_input->>'note');
 if p_request_id is null or jsonb_typeof(p_input) is distinct from 'object' or exists(select 1 from jsonb_object_keys(p_input) k where k not in ('action','expectedRevision','note')) or jsonb_typeof(p_input->'note') is distinct from 'string' or coalesce(length(v_note),0) not between 3 and 2000 or jsonb_typeof(p_input->'expectedRevision') is distinct from 'number' or (p_input->>'expectedRevision') !~ '^[0-9]{1,10}$' then raise exception 'invalid_verification_input';end if;
 if o.verification_revision<>(p_input->>'expectedRevision')::bigint then raise exception 'verification_changed';end if;
 if o.status<>'pending_verification' or (v_action='clear_review' and o.review_status<>'pending') or (v_action='request_review' and o.review_status='pending') then raise exception 'verification_transition_invalid';end if;
 update public.orders set review_status=case when v_action='clear_review' then 'cleared' else 'pending' end,
 review_flags=case when v_action='request_review' and not exists(select 1 from jsonb_array_elements(review_flags) f where f->>'code'='staff_review') then review_flags||jsonb_build_array(jsonb_build_object('code','staff_review','label','Staff requested manual review.','count',1,'threshold',1)) else review_flags end,
 reviewed_by=case when v_action='clear_review' then auth.uid() else null end,reviewed_at=case when v_action='clear_review' then now() else null end,review_note=v_note,verification_revision=verification_revision+1 where id=o.id;
 if (select coalesce(max(attempt_number),0) from public.cod_verifications where order_id=o.id)>=200 then raise exception 'verification_attempt_limit';end if;
 insert into public.cod_verifications(order_id,attempt_number,method,status,initiated_by,note,contact_channel,staff_action)
 select o.id,coalesce(max(attempt_number),0)+1,'admin','pending',auth.uid(),v_note,'admin',v_action from public.cod_verifications where order_id=o.id;
 select jsonb_build_object('id',id,'status',status,'verification_status',verification_status,'verification_revision',verification_revision,'review_status',review_status) into v_result from public.orders where id=o.id;
 insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,before_data,after_data,request_id) values(auth.uid(),'cod.verification.'||v_action,'order',o.id,jsonb_build_object('review_status',o.review_status,'revision',o.verification_revision),v_result,p_request_id::text);
 insert into app_private.admin_verification_receipts(actor_user_id,request_id,order_id,input_hash,result) values(auth.uid(),p_request_id,o.id,v_hash,v_result);
 return v_result;
end;$function$;

-- Preserve the existing business transaction; replace access/recipient dependencies only.
CREATE OR REPLACE FUNCTION app_private.staff_verification_action_base(p_order_id uuid, p_request_id uuid, p_input jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare o public.orders%rowtype;r app_private.admin_verification_receipts%rowtype;v_hash text;v_action text;v_note text;v_channel text;v_outcome text;v_attempt int;v_next public.order_status;v_verify public.verification_status;v_result jsonb;
begin
 if auth.uid() is null or not app_private.account_session_valid() then raise exception 'authentication_required';end if;
 perform app_private.owner_require();
 -- Prevent role revocation during this authorized transaction.
 perform 1 from app_private.store_owner where singleton and user_id=auth.uid() for share;
 if not found then raise exception 'staff_access_required';end if;
 if p_request_id is null or jsonb_typeof(p_input) is distinct from 'object' then raise exception 'invalid_verification_input';end if;
 if exists(select 1 from jsonb_object_keys(p_input) k where k not in ('action','expectedRevision','note','channel','outcome')) then raise exception 'invalid_verification_input';end if;
 v_action:=p_input->>'action';v_note:=trim(p_input->>'note');v_channel:=p_input->>'channel';v_outcome:=p_input->>'outcome';
 if v_action is null or v_action not in ('contact','confirm','reject','cancel') or v_note is null or length(v_note) not between 3 and 2000
 or jsonb_typeof(p_input->'note') is distinct from 'string' or jsonb_typeof(p_input->'expectedRevision') is distinct from 'number'
 or (p_input->>'expectedRevision') !~ '^[0-9]{1,10}$' then raise exception 'invalid_verification_input';end if;
 if v_action='contact' then
  if v_channel is null or v_channel not in ('phone','whatsapp','email','admin') or v_outcome is null or v_outcome not in ('reached','no_response','failed') then raise exception 'invalid_verification_input';end if;
 elsif p_input ? 'channel' or p_input ? 'outcome' then raise exception 'invalid_verification_input';end if;
 perform app_private.commerce_lock(); -- Same lock ordering as checkout and inventory cancellation.
 v_hash:=encode(extensions.digest(jsonb_build_object('order_id',p_order_id,'input',p_input)::text,'sha256'),'hex');
 select * into r from app_private.admin_verification_receipts where actor_user_id=auth.uid() and request_id=p_request_id;
 if found then if r.input_hash<>v_hash then raise exception 'verification_idempotency_conflict';end if;return r.result;end if;
 select * into o from public.orders where id=p_order_id for update;if not found then raise exception 'order_unavailable';end if;
 if o.verification_revision<>(p_input->>'expectedRevision')::bigint then raise exception 'verification_changed';end if;
 if v_action in ('contact','confirm','reject') and (o.status<>'pending_verification' or o.verification_status not in ('pending','sent','customer_confirmed')) then raise exception 'verification_transition_invalid';end if;
 if v_action in ('reject','cancel') and (o.status not in ('pending_verification','confirmed') or o.cod_settlement_status<>'not_due' or exists(select 1 from public.shipments where order_id=o.id)) then raise exception 'cancellation_unavailable';end if;
 select coalesce(max(attempt_number),0)+1 into v_attempt from public.cod_verifications where order_id=o.id;
 if v_attempt>200 then raise exception 'verification_attempt_limit';end if;
 v_next:=case when v_action='confirm' then 'confirmed'::public.order_status when v_action in ('reject','cancel') then 'cancelled'::public.order_status else o.status end;
 v_verify:=case when v_action='confirm' then 'admin_approved'::public.verification_status when v_action='reject' then 'rejected'::public.verification_status else o.verification_status end;
 insert into public.cod_verifications(order_id,attempt_number,method,status,initiated_by,verified_by,note,contact_channel,contact_outcome,staff_action,sent_at,responded_at,verified_at)
 values(o.id,v_attempt,case when v_channel='whatsapp' then 'whatsapp'::public.verification_method else 'admin'::public.verification_method end,v_verify,auth.uid(),case when v_action='confirm' then auth.uid() else null end,v_note,case when v_action='contact' then v_channel else 'admin' end,v_outcome,v_action,case when v_action='contact' then now() else null end,case when v_outcome='reached' then now() else null end,case when v_action='confirm' then now() else null end);
 update public.orders set status=v_next,verification_status=v_verify,verification_revision=verification_revision+1,
  confirmed_at=case when v_action='confirm' then now() else confirmed_at end,cancelled_at=case when v_next='cancelled' then now() else cancelled_at end where id=o.id;
 if v_next is distinct from o.status then
  -- Staff notes are private in cod_verifications; customer progress carries status only.
  insert into public.order_status_history(order_id,from_status,to_status,note,changed_by) values(o.id,o.status,v_next,'Staff COD verification action: '||v_action,auth.uid());
  if o.customer_id is not null then
   insert into public.notifications(recipient_customer_id,event_key,title,body,entity_type,entity_id,data)
   values(o.customer_id,'order.'||v_next,case when v_next='confirmed' then 'Order confirmed' else 'Order cancelled' end,
    case when v_next='confirmed' then 'Your Cash on Delivery order has been confirmed.' else 'Your order has been cancelled. Contact the store if you need help.' end,'order',o.id,jsonb_build_object('href','/account/orders/'||o.id));
  end if;
 end if;
 v_result:=jsonb_build_object('id',o.id,'status',v_next,'verification_status',v_verify,'verification_revision',o.verification_revision+1);
 insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,before_data,after_data,request_id)
 values(auth.uid(),'cod.verification.'||v_action,'order',o.id,jsonb_build_object('status',o.status,'verification_status',o.verification_status,'revision',o.verification_revision),v_result,p_request_id::text);
 insert into app_private.admin_verification_receipts(actor_user_id,request_id,order_id,input_hash,result) values(auth.uid(),p_request_id,o.id,v_hash,v_result);
 return v_result;
end; $function$;

-- Preserve the existing business transaction; replace access/recipient dependencies only.
CREATE OR REPLACE FUNCTION app_private.staff_verification_detail_base(p_order_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare o public.orders%rowtype;v_order jsonb;v_items jsonb;v_address jsonb;v_attempts jsonb;v_history jsonb;v_shipment boolean;
begin
 if auth.uid() is null or not app_private.account_session_valid() then raise exception 'authentication_required';end if;
 if not app_private.is_owner() then raise exception 'staff_access_required';end if;
 select * into o from public.orders where id=p_order_id;if not found then raise exception 'order_unavailable';end if;
 select exists(select 1 from public.shipments where order_id=o.id) into v_shipment;
 v_order:=jsonb_build_object('id',o.id,'order_number',o.order_number,'contact_name',o.contact_name,'contact_email',o.contact_email,'contact_phone',o.contact_phone,'contact_whatsapp',o.contact_whatsapp,'status',o.status,'verification_status',o.verification_status,'verification_revision',o.verification_revision,'total_pkr',o.total_pkr,'subtotal_pkr',o.subtotal_pkr,'discount_pkr',o.discount_pkr,'shipping_pkr',o.shipping_pkr,'tax_pkr',o.tax_pkr,'customer_note',o.customer_note,'placed_at',o.placed_at,'confirmed_at',o.confirmed_at,'cancelled_at',o.cancelled_at,'cod_settlement_status',o.cod_settlement_status);
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'product_name',product_name,'variant_name',variant_name,'sku',sku,'quantity',quantity,'line_total_pkr',line_total_pkr) order by created_at,id),'[]') into v_items from public.order_items where order_id=o.id;
 select jsonb_build_object('recipient_name',recipient_name,'phone',phone,'line1',address_line1,'line2',address_line2,'city',city,'province',province,'postal_code',postal_code) into v_address from public.order_addresses where order_id=o.id limit 1;
 select coalesce(jsonb_agg(jsonb_build_object('id',v.id,'attempt_number',v.attempt_number,'method',v.method,'status',v.status,'contact_channel',v.contact_channel,'contact_outcome',v.contact_outcome,'staff_action',v.staff_action,'note',v.note,'initiated_by',v.initiated_by,'verified_by',v.verified_by,'created_at',v.created_at,'verified_at',v.verified_at,'staff_name',p.display_name) order by v.attempt_number desc),'[]') into v_attempts from public.cod_verifications v left join public.profiles p on p.id=coalesce(v.verified_by,v.initiated_by) where v.order_id=o.id;
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'from_status',from_status,'to_status',to_status,'changed_by',changed_by,'created_at',created_at) order by created_at,id),'[]') into v_history from public.order_status_history where order_id=o.id;
 return jsonb_build_object('order',v_order,'items',v_items,'address',v_address,'attempts',v_attempts,'history',v_history,
  'can_verify',o.status='pending_verification' and o.verification_status in ('pending','sent','customer_confirmed'),
  'can_cancel',o.status in ('pending_verification','confirmed') and o.cod_settlement_status='not_due' and not v_shipment);
end; $function$;

-- Preserve the existing business transaction; replace access/recipient dependencies only.
CREATE OR REPLACE FUNCTION app_private.staff_verification_policy(p_request_id uuid DEFAULT NULL::uuid, p_input jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare p app_private.cod_review_policy%rowtype;r app_private.cod_policy_receipts%rowtype;v_values jsonb;v_hash text;v_result jsonb;v_before jsonb;v_note text;v_field text;
begin
 if auth.uid() is null or not app_private.account_session_valid() then raise exception 'authentication_required';end if;
 if not app_private.is_super_admin() then raise exception 'staff_access_required';end if;
 if p_input is null and p_request_id is null then return app_private.cod_policy_json();end if;
 if p_request_id is null or jsonb_typeof(p_input) is distinct from 'object' or exists(select 1 from jsonb_object_keys(p_input) k where k not in ('expectedRevision','note','values')) then raise exception 'invalid_verification_policy';end if;
 v_values:=p_input->'values';v_note:=trim(p_input->>'note');
 if jsonb_typeof(v_values) is distinct from 'object' or jsonb_typeof(p_input->'note') is distinct from 'string' or coalesce(length(v_note),0) not between 3 and 1000 or jsonb_typeof(p_input->'expectedRevision') is distinct from 'number' or (p_input->>'expectedRevision') !~ '^[0-9]{1,10}$'
 or jsonb_typeof(v_values->'verificationRequired') is distinct from 'boolean' or (select count(*) from jsonb_object_keys(v_values))<>7 then raise exception 'invalid_verification_policy';end if;
 foreach v_field in array array['highValuePkr','duplicateWindowHours','failedDeliveryCount','failedDeliveryLookbackDays','maxOrders24h','maxOrdersHour'] loop
  if jsonb_typeof(v_values->v_field) is distinct from 'number' or (v_values->>v_field) !~ '^[0-9]{1,10}$' then raise exception 'invalid_verification_policy';end if;
 end loop;
 if (v_values->>'highValuePkr')::bigint not between 1000 and 1000000 or (v_values->>'duplicateWindowHours')::int not between 1 and 72 or (v_values->>'failedDeliveryCount')::int not between 1 and 10 or (v_values->>'failedDeliveryLookbackDays')::int not between 1 and 365 or (v_values->>'maxOrders24h')::int not between 1 and 20 or (v_values->>'maxOrdersHour')::int not between 1 and 10 or (v_values->>'maxOrdersHour')::int>(v_values->>'maxOrders24h')::int then raise exception 'invalid_verification_policy';end if;
 perform 1 from app_private.store_owner where singleton and user_id=auth.uid() for share;if not found then raise exception 'staff_access_required';end if;
 perform app_private.commerce_lock();
 v_hash:=encode(extensions.digest(p_input::text,'sha256'),'hex');
 select * into r from app_private.cod_policy_receipts where actor_user_id=auth.uid() and request_id=p_request_id;
 if found then if r.input_hash<>v_hash then raise exception 'verification_idempotency_conflict';end if;return r.result;end if;
 select * into p from app_private.cod_review_policy where singleton for update;
 if p.revision<>(p_input->>'expectedRevision')::bigint then raise exception 'verification_changed';end if;
 v_before:=app_private.cod_policy_json();
 update app_private.cod_review_policy set revision=revision+1,verification_required=(v_values->>'verificationRequired')::boolean,high_value_pkr=(v_values->>'highValuePkr')::bigint,duplicate_window_hours=(v_values->>'duplicateWindowHours')::int,failed_delivery_count=(v_values->>'failedDeliveryCount')::int,failed_delivery_days=(v_values->>'failedDeliveryLookbackDays')::int,max_orders_day=(v_values->>'maxOrders24h')::int,max_orders_hour=(v_values->>'maxOrdersHour')::int where singleton;
 update public.system_settings set value=v_values->'verificationRequired' where key='cod.verification_required';
 update public.system_settings set value=v_values->'maxOrders24h' where key='checkout.max_orders_per_day';
 v_result:=app_private.cod_policy_json();
 insert into public.audit_logs(actor_user_id,action,entity_type,before_data,after_data,request_id) values(auth.uid(),'cod.policy.updated','system_settings',v_before,v_result||jsonb_build_object('note',v_note),p_request_id::text);
 insert into app_private.cod_policy_receipts(actor_user_id,request_id,input_hash,result) values(auth.uid(),p_request_id,v_hash,v_result);
 return v_result;
end;$function$;

-- Preserve the existing business transaction; replace access/recipient dependencies only.
CREATE OR REPLACE FUNCTION app_private.staff_verification_queue(p_filter text DEFAULT 'pending'::text, p_before uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_before timestamptz;v_rows jsonb;v_items jsonb;
begin
 if auth.uid() is null or not app_private.account_session_valid() then raise exception 'authentication_required';end if;
 if not app_private.is_owner() then raise exception 'staff_access_required';end if;
 if p_filter is null or p_filter not in ('pending','review','confirmed','cancelled','all') then raise exception 'invalid_queue_filter';end if;
 if p_before is not null then select placed_at into v_before from public.orders where id=p_before;if not found then raise exception 'invalid_queue_cursor';end if;end if;
 select coalesce(jsonb_agg(to_jsonb(q) order by placed_at desc,id desc),'[]') into v_rows from (
  select o.id,o.order_number,o.contact_name,o.contact_phone,o.status,o.verification_status,o.total_pkr,o.placed_at,o.review_status,jsonb_array_length(o.review_flags) as review_flag_count,
   (select a.city from public.order_addresses a where a.order_id=o.id limit 1) as city
  from public.orders o where (p_filter='all' or (p_filter='review' and o.review_status='pending') or o.status::text=case when p_filter='pending' then 'pending_verification' else p_filter end)
  and (p_before is null or (o.placed_at,o.id)<(v_before,p_before)) order by o.placed_at desc,o.id desc limit 21
 ) q;
 select coalesce(jsonb_agg(value order by ordinality),'[]') into v_items from jsonb_array_elements(v_rows) with ordinality where ordinality<=20;
 return jsonb_build_object('items',v_items,'next_cursor',case when jsonb_array_length(v_rows)>20 then v_rows->19->>'id' else null end);
end; $function$;


-- Remove management entry points before retiring their underlying model.
drop function public.staff_access_action(uuid,jsonb);
drop function public.staff_directory(uuid);
drop function public.staff_context();
drop function app_private.staff_access_action(uuid,jsonb);
drop function app_private.staff_directory(uuid);
drop function app_private.staff_context();
drop function app_private.staff_require_permission(text);
drop function app_private.staff_has_permission(text);
drop trigger staff_owner_protected on public.staff_profiles;
drop function app_private.protect_staff_owner();

-- Preserve access history privately for rollback; there is no active staff directory.
alter table public.staff_profiles set schema app_private;
alter table app_private.staff_profiles rename to legacy_staff_profiles;
alter table public.role_permissions set schema app_private;
alter table app_private.role_permissions rename to legacy_role_permissions;
alter table public.permissions set schema app_private;
alter table app_private.permissions rename to legacy_permissions;
alter table public.roles set schema app_private;
alter table app_private.roles rename to legacy_roles;
alter table app_private.staff_access_receipts rename to legacy_staff_access_receipts;
revoke all on app_private.legacy_staff_profiles,app_private.legacy_roles,app_private.legacy_permissions,app_private.legacy_role_permissions,app_private.legacy_staff_access_receipts from public,anon,authenticated;

-- Read-only bridge for the immediately preceding deployment. This is not a staff table:
-- it exposes only the current owner to that owner's valid session and permits no writes.
grant select on app_private.store_owner to authenticated;
create policy store_owner_self_read on app_private.store_owner for select to authenticated
using (user_id=(select auth.uid()) and (select app_private.is_owner()));
create view public.staff_profiles with (security_invoker=true) as
 select user_id,'super_admin'::text as role_slug,true as is_active,created_at,created_at as updated_at,
  0::integer as access_revision,access_valid_after
 from app_private.store_owner where (select app_private.is_owner());
revoke all on public.staff_profiles from public,anon,authenticated;
grant select on public.staff_profiles to authenticated;

-- Fail the transaction if an active function still depends on the retired access model.
do $$ begin
 if exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname in ('public','app_private') and p.prokind='f' and
  p.prosrc ~ 'public\.(roles|permissions|role_permissions|staff_profiles)|staff_has_permission|staff_require_permission')
 then raise exception 'retired_staff_dependency_remaining'; end if;
 if (select count(*) from app_private.store_owner)<>1 then raise exception 'single_owner_postcondition_failed'; end if;
end $$;
