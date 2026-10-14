-- Deterministic review signals, not an AI score. Customer status/PII grants stay unchanged.
create table app_private.cod_review_policy (
 singleton boolean primary key default true check(singleton),revision bigint not null default 0,
 verification_required boolean not null default true,
 high_value_pkr bigint not null default 25000 check(high_value_pkr between 1000 and 1000000),
 duplicate_window_hours int not null default 24 check(duplicate_window_hours between 1 and 72),
 failed_delivery_count int not null default 2 check(failed_delivery_count between 1 and 10),
 failed_delivery_days int not null default 180 check(failed_delivery_days between 1 and 365),
 max_orders_day int not null default 5 check(max_orders_day between 1 and 20),
 max_orders_hour int not null default 3 check(max_orders_hour between 1 and 10 and max_orders_hour<=max_orders_day)
);
insert into app_private.cod_review_policy(singleton,verification_required,max_orders_day,max_orders_hour)
 select true,coalesce((select (value#>>'{}')::boolean from public.system_settings where key='cod.verification_required'),true),
 coalesce((select (value#>>'{}')::int from public.system_settings where key='checkout.max_orders_per_day'),5),least(3,coalesce((select (value#>>'{}')::int from public.system_settings where key='checkout.max_orders_per_day'),5));
alter table app_private.cod_review_policy enable row level security;
revoke all on app_private.cod_review_policy from public,anon,authenticated;
create table app_private.cod_policy_receipts(actor_user_id uuid not null references auth.users(id),request_id uuid not null,input_hash text not null,result jsonb not null,created_at timestamptz not null default now(),primary key(actor_user_id,request_id));
alter table app_private.cod_policy_receipts enable row level security;
revoke all on app_private.cod_policy_receipts from public,anon,authenticated;
alter table public.orders add column review_status text not null default 'not_required' check(review_status in ('not_required','pending','cleared','closed'));
alter table public.orders add column review_flags jsonb not null default '[]' check(jsonb_typeof(review_flags)='array');
alter table public.orders add column reviewed_by uuid references auth.users(id);
alter table public.orders add column reviewed_at timestamptz;
alter table public.orders add column review_note text;
create index orders_manual_review_idx on public.orders(placed_at desc,id desc) where review_status='pending';
create index orders_reviewed_by_idx on public.orders(reviewed_by) where reviewed_by is not null;

create function app_private.order_phone(p_phone text) returns text language sql immutable set search_path='' as $$
 select case when regexp_replace(p_phone,'[ ()-]','','g') ~ '^(\+92|0092|92|0)3[0-9]{9}$' then '+92'||right(regexp_replace(p_phone,'[ ()-]','','g'),10) else null end;
$$;
revoke all on function app_private.order_phone(text) from public,anon,authenticated;
create index orders_review_phone_date_idx on public.orders((app_private.order_phone(contact_phone)),placed_at);

create function app_private.checkout_hour_limit(p_customer uuid,p_guest text,p_phone text) returns void language plpgsql security definer set search_path='' as $$
declare v_limit int;begin
 select max_orders_hour into v_limit from app_private.cod_review_policy where singleton;
 if (select count(*) from public.orders where placed_at>now()-interval '1 hour' and (app_private.order_phone(contact_phone)=p_phone or (p_customer is not null and customer_id=p_customer)))>=v_limit
 or (p_guest is not null and (select count(*) from app_private.checkout_receipts where created_at>now()-interval '1 hour' and guest_hash=p_guest)>=v_limit)
 then raise exception 'checkout_order_limit';end if;
end;$$;
revoke all on function app_private.checkout_hour_limit(uuid,text,text) from public,anon,authenticated;

create function app_private.cod_review_signals(p_phone text,p_total bigint,p_exclude uuid default null) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare p app_private.cod_review_policy%rowtype;v_flags jsonb:='[]';v_count int;
begin
 select * into p from app_private.cod_review_policy where singleton;
 if p_total>=p.high_value_pkr then v_flags:=v_flags||jsonb_build_array(jsonb_build_object('code','high_value','label','Order total reaches the high-value threshold.','count',1,'threshold',p.high_value_pkr));end if;
 select count(*) into v_count from public.orders o where app_private.order_phone(o.contact_phone)=p_phone and o.total_pkr=p_total and o.status<>'cancelled' and o.placed_at>now()-make_interval(hours=>p.duplicate_window_hours) and (p_exclude is null or o.id<>p_exclude);
 if v_count>0 then v_flags:=v_flags||jsonb_build_array(jsonb_build_object('code','possible_duplicate','label','Recent non-cancelled orders share this phone and total.','count',v_count,'threshold',1,'window',p.duplicate_window_hours));end if;
 select count(*) into v_count from public.orders o where app_private.order_phone(o.contact_phone)=p_phone and o.placed_at>now()-make_interval(days=>p.failed_delivery_days) and (p_exclude is null or o.id<>p_exclude)
 and (o.status in ('delivery_failed','rto_initiated','rto_in_transit','rto_received') or (o.status not in ('delivered','cancelled') and exists(select 1 from public.shipments s join public.delivery_attempts a on a.shipment_id=s.id where s.order_id=o.id and a.status='failed')));
 if v_count>=p.failed_delivery_count then v_flags:=v_flags||jsonb_build_array(jsonb_build_object('code','failed_delivery_history','label','Prior orders have recorded failed delivery or RTO.','count',v_count,'threshold',p.failed_delivery_count,'window',p.failed_delivery_days));end if;
 return v_flags;
end;$$;
revoke all on function app_private.cod_review_signals(text,bigint,uuid) from public,anon,authenticated;

create function app_private.set_cod_review() returns trigger language plpgsql security definer set search_path='' as $$
declare v_limit int;
begin
 perform app_private.commerce_lock();
 new.contact_phone:=app_private.order_phone(new.contact_phone);if new.contact_phone is null then raise exception 'invalid_checkout';end if;
 if new.placed_at>now()-interval '24 hours' then
  select max_orders_day into v_limit from app_private.cod_review_policy where singleton;
  if (select count(*) from public.orders where placed_at>now()-interval '24 hours' and app_private.order_phone(contact_phone)=new.contact_phone)>=v_limit then raise exception 'checkout_order_limit';end if;
  perform app_private.checkout_hour_limit(new.customer_id,null,new.contact_phone);
 end if;
 new.review_flags:=app_private.cod_review_signals(new.contact_phone,new.total_pkr,new.id);
 if jsonb_array_length(new.review_flags)>0 and new.status in ('pending_verification','confirmed') then new.review_status:='pending';new.status:='pending_verification';new.verification_status:='pending';new.confirmed_at:=null;end if;
 return new;
end;$$;
revoke all on function app_private.set_cod_review() from public,anon,authenticated;
create trigger orders_cod_review before insert on public.orders for each row execute function app_private.set_cod_review();
create function app_private.guard_cod_review() returns trigger language plpgsql security definer set search_path='' as $$begin
 if new.review_status='pending' and new.status in ('confirmed','processing','packed','ready_to_ship','shipped','out_for_delivery','delivered') then raise exception 'manual_review_required';end if;
 if new.status='cancelled' and new.review_status='pending' then new.review_status:='closed';end if;
 return new;
end;$$;
revoke all on function app_private.guard_cod_review() from public,anon,authenticated;
create trigger orders_cod_review_guard before update on public.orders for each row execute function app_private.guard_cod_review();
create function app_private.guard_review_shipment() returns trigger language plpgsql security definer set search_path='' as $$begin
 perform app_private.commerce_lock();
 if new.status<>'cancelled' and exists(select 1 from public.orders where id=new.order_id and review_status='pending') then raise exception 'manual_review_required';end if;return new;
end;$$;
revoke all on function app_private.guard_review_shipment() from public,anon,authenticated;
create trigger shipments_cod_review_guard before insert or update on public.shipments for each row execute function app_private.guard_review_shipment();

-- Preserve the existing action contract behind a private-only implementation.
alter function app_private.staff_verification_action(uuid,uuid,jsonb) rename to staff_verification_action_base;
revoke all on function app_private.staff_verification_action_base(uuid,uuid,jsonb) from public,anon,authenticated;
create function app_private.staff_verification_action(p_order_id uuid,p_request_id uuid,p_input jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare o public.orders%rowtype;r app_private.staff_verification_receipts%rowtype;v_hash text;v_action text;v_note text;v_result jsonb;
begin
 if auth.uid() is null or not app_private.account_session_valid() then raise exception 'authentication_required';end if;
 if not app_private.is_super_admin() then raise exception 'staff_access_required';end if;
 perform 1 from public.staff_profiles where user_id=auth.uid() and is_active and role_slug='super_admin' for share;
 if not found then raise exception 'staff_access_required';end if;
 perform app_private.commerce_lock();
 v_hash:=encode(extensions.digest(jsonb_build_object('order_id',p_order_id,'input',p_input)::text,'sha256'),'hex');
 select * into r from app_private.staff_verification_receipts where actor_user_id=auth.uid() and request_id=p_request_id;
 if found then if r.input_hash<>v_hash then raise exception 'verification_idempotency_conflict';end if;return r.result;end if;
 select * into o from public.orders where id=p_order_id for update;if not found then raise exception 'order_unavailable';end if;
 v_action:=p_input->>'action';
 if p_request_id is null or jsonb_typeof(p_input) is distinct from 'object' or v_action is null or v_action not in ('contact','confirm','reject','cancel','request_review','clear_review') then raise exception 'invalid_verification_input';end if;
 if v_action not in ('request_review','clear_review') then
  if v_action='confirm' and o.review_status='pending' then raise exception 'manual_review_required';end if;
  v_result:=app_private.staff_verification_action_base(p_order_id,p_request_id,p_input);
  select review_status into v_note from public.orders where id=p_order_id;
  v_result:=v_result||jsonb_build_object('review_status',v_note);
  update app_private.staff_verification_receipts set result=v_result where actor_user_id=auth.uid() and request_id=p_request_id;
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
 insert into app_private.staff_verification_receipts(actor_user_id,request_id,order_id,input_hash,result) values(auth.uid(),p_request_id,o.id,v_hash,v_result);
 return v_result;
end;$$;
alter table public.cod_verifications drop constraint cod_verifications_staff_action_check;
alter table public.cod_verifications add constraint cod_verifications_staff_action_check check(staff_action in ('contact','confirm','reject','cancel','request_review','clear_review'));

alter function app_private.staff_verification_detail(uuid) rename to staff_verification_detail_base;
revoke all on function app_private.staff_verification_detail_base(uuid) from public,anon,authenticated;
create function app_private.staff_verification_detail(p_order_id uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$declare v_data jsonb;v_review jsonb;begin
 v_data:=app_private.staff_verification_detail_base(p_order_id);
 select jsonb_build_object('status',review_status,'flags',review_flags,'reviewed_by',reviewed_by,'reviewed_at',reviewed_at,'note',review_note) into v_review from public.orders where id=p_order_id;
 return v_data||jsonb_build_object('review',v_review);
end;$$;

create function app_private.cod_policy_json() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('revision',revision,'verificationRequired',verification_required,'highValuePkr',high_value_pkr,'duplicateWindowHours',duplicate_window_hours,'failedDeliveryCount',failed_delivery_count,'failedDeliveryLookbackDays',failed_delivery_days,'maxOrders24h',max_orders_day,'maxOrdersHour',max_orders_hour) from app_private.cod_review_policy where singleton;
$$;
revoke all on function app_private.cod_policy_json() from public,anon,authenticated;
create function app_private.staff_verification_policy(p_request_id uuid default null,p_input jsonb default null) returns jsonb language plpgsql security definer set search_path='' as $$
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
 perform 1 from public.staff_profiles where user_id=auth.uid() and is_active and role_slug='super_admin' for share;if not found then raise exception 'staff_access_required';end if;
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
end;$$;
revoke all on function app_private.staff_verification_policy(uuid,jsonb) from public,anon;
grant execute on function app_private.staff_verification_policy(uuid,jsonb) to authenticated;
create function public.staff_verification_policy(p_request_id uuid default null,p_input jsonb default null) returns jsonb language sql security invoker set search_path='' as $$select app_private.staff_verification_policy(p_request_id,p_input);$$;
revoke all on function public.staff_verification_policy(uuid,jsonb) from public,anon;
grant execute on function public.staff_verification_policy(uuid,jsonb) to authenticated;

create function app_private.notify_cod_review() returns trigger language plpgsql security definer set search_path='' as $$begin
 if new.review_status='pending' then
  insert into public.notifications(recipient_user_id,event_key,title,body,priority,entity_type,entity_id,data)
  select user_id,'order.review_required','COD order needs manual review','Review the recorded signals before confirming this order.','high','order',new.id,jsonb_build_object('href','/crm/verification/'||new.id) from public.staff_profiles where is_active and role_slug='super_admin';
 end if;return new;
end;$$;
revoke all on function app_private.notify_cod_review() from public,anon,authenticated;
create trigger orders_notify_cod_review after insert on public.orders for each row execute function app_private.notify_cod_review();

create or replace function app_private.staff_verification_queue(p_filter text default 'pending',p_before uuid default null)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_before timestamptz;v_rows jsonb;v_items jsonb;
begin
 if auth.uid() is null or not app_private.account_session_valid() then raise exception 'authentication_required';end if;
 if not app_private.is_super_admin() then raise exception 'staff_access_required';end if;
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
end; $$;

create or replace function app_private.checkout_place_order(p_guest_hash text,p_key uuid,p_revision text,p_input jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
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
 insert into public.notifications(recipient_user_id,event_key,title,body,priority,entity_type,entity_id,data) select user_id,'order.placed','New COD order','A new Cash on Delivery order awaits processing.','high','order',v_order,jsonb_build_object('href','/crm','order_id',v_order) from public.staff_profiles where is_active and role_slug='super_admin';
 select 'DWELLUNE — Order '||order_number||E'\n\nWe have received your Cash on Delivery order. '||case when v_required then 'It is awaiting verification.' else 'It is confirmed.' end||E'\n\n' into v_text from public.orders where id=v_order;
 for r in select * from public.order_items where order_id=v_order order by created_at,id loop v_text:=v_text||r.product_name||' / '||r.variant_name||' × '||r.quantity||' — PKR '||r.line_total_pkr||E'\n'; end loop;
 v_text:=v_text||E'\nSubtotal: PKR '||(v_totals->>'subtotal_pkr')||E'\nDiscount: PKR '||(v_totals->>'discount_pkr')||E'\nDelivery: PKR '||(v_totals->>'shipping_pkr')||E'\nDue on delivery: PKR '||(v_totals->>'total_pkr')||E'\n\nNo online payment is required. Keep your order number for support.\n';
 insert into app_private.order_email_outbox(order_id,notification_id,payload) select v_order,v_notification,jsonb_build_object('to',jsonb_build_array(v_email),'subject','DWELLUNE — Order '||order_number||' received','text',v_text) from public.orders where id=v_order;
 update public.carts set status='converted',converted_order_id=v_order,guest_token_hash=case when v_customer is null then encode(extensions.digest('converted:'||v_order::text,'sha256'),'hex') else null end,updated_at=now() where id=v_cart;
 return app_private.checkout_confirmation(v_order,p_guest_hash);
end; $$;

revoke all on function app_private.staff_verification_action(uuid,uuid,jsonb),app_private.staff_verification_detail(uuid) from public,anon;
grant execute on function app_private.staff_verification_action(uuid,uuid,jsonb),app_private.staff_verification_detail(uuid) to authenticated;
create or replace function public.staff_verification_action(p_order_id uuid,p_request_id uuid,p_input jsonb) returns jsonb language sql security invoker set search_path='' as $$select app_private.staff_verification_action(p_order_id,p_request_id,p_input);$$;
create or replace function public.staff_verification_detail(p_order_id uuid) returns jsonb language sql security invoker set search_path='' as $$select app_private.staff_verification_detail(p_order_id);$$;
