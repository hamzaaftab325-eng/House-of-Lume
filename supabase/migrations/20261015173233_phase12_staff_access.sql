-- Phase 12 Part 1: fixed roles, live authorization and controlled staff access.
insert into public.roles(slug,name,description) values
 ('cod_verifier','COD verifier','Verify COD orders and read assigned staff notifications.'),
 ('catalog_manager','Catalog manager','Catalog and inventory access; management screens arrive in Phase 13.')
on conflict(slug) do update set name=excluded.name,description=excluded.description;
insert into public.permissions(slug,name,description) values
 ('crm.access','Open CRM','Open the staff workspace with a live staff session.'),
 ('verification.manage','Verify COD orders','Read the verification queue and record contact, review and decisions.'),
 ('notifications.view','Read staff notifications','Read only notifications addressed to this staff account.')
on conflict(slug) do update set name=excluded.name,description=excluded.description;
insert into public.role_permissions(role_slug,permission_slug)
select 'super_admin',slug from public.permissions on conflict do nothing;
insert into public.role_permissions(role_slug,permission_slug) values
 ('cod_verifier','crm.access'),('cod_verifier','verification.manage'),('cod_verifier','notifications.view'),
 ('catalog_manager','crm.access'),('catalog_manager','catalog.manage'),('catalog_manager','inventory.manage'),('catalog_manager','notifications.view')
on conflict do nothing;
alter table public.staff_profiles add column access_revision integer not null default 0,
 add column access_valid_after timestamptz not null default '-infinity';
-- Changes must use the audited RPC; even the owner cannot bypass it through the Data API.
revoke all on public.staff_profiles,public.roles,public.permissions,public.role_permissions,public.audit_logs from anon,authenticated;
grant select on public.staff_profiles,public.roles,public.permissions,public.role_permissions,public.audit_logs to authenticated;

create function app_private.staff_has_permission(p_permission text) returns boolean
language sql stable security definer set search_path='' as $$
 select app_private.account_session_valid() and exists(
  select 1 from public.staff_profiles s
  join public.role_permissions rp on rp.role_slug=s.role_slug
  join public.customers c on c.user_id=s.user_id and c.status='active'
  join auth.users u on u.id=s.user_id and (u.banned_until is null or u.banned_until<=now())
  join auth.sessions se on se.user_id=s.user_id and se.id::text=(auth.jwt()->>'session_id')
  where s.user_id=auth.uid() and s.is_active and rp.permission_slug=p_permission
   and se.created_at>=s.access_valid_after
 );
$$;
revoke all on function app_private.staff_has_permission(text) from public,anon;
grant execute on function app_private.staff_has_permission(text) to authenticated;
create or replace function app_private.is_super_admin() returns boolean language sql stable security definer set search_path='' as $$
 select app_private.staff_has_permission('crm.access') and exists(
  select 1 from public.staff_profiles where user_id=auth.uid() and role_slug='super_admin' and is_active
 );
$$;
create function app_private.staff_require_permission(p_permission text) returns void
language plpgsql security definer set search_path='' as $$begin
 if not app_private.account_session_valid() then raise exception 'authentication_required';end if;
 -- A concurrent deactivation/role change waits for already-authorized writes to finish.
 perform 1 from public.staff_profiles where user_id=auth.uid() for share;
 if not found or not app_private.staff_has_permission(p_permission) then raise exception 'staff_access_required';end if;
end;$$;
revoke all on function app_private.staff_require_permission(text) from public,anon,authenticated;

create function app_private.staff_context() returns jsonb language plpgsql stable security definer set search_path='' as $$declare v jsonb;begin
 if not app_private.account_session_valid() then raise exception 'authentication_required';end if;
 if not app_private.staff_has_permission('crm.access') then raise exception 'staff_access_required';end if;
 select jsonb_build_object('userId',s.user_id,'email',u.email,'customerId',c.id,'role',s.role_slug,'roleName',r.name,
  'revision',s.access_revision,'permissions',(select jsonb_agg(permission_slug order by permission_slug) from public.role_permissions where role_slug=s.role_slug))
 into v from public.staff_profiles s join auth.users u on u.id=s.user_id join public.customers c on c.user_id=s.user_id
 join public.roles r on r.slug=s.role_slug where s.user_id=auth.uid();return v;
end;$$;
revoke all on function app_private.staff_context() from public,anon;
grant execute on function app_private.staff_context() to authenticated;
create function public.staff_context() returns jsonb language sql stable security invoker set search_path='' as $$select app_private.staff_context();$$;
revoke all on function public.staff_context() from public,anon;
grant execute on function public.staff_context() to authenticated;

create function app_private.protect_staff_owner() returns trigger language plpgsql security definer set search_path='' as $$begin
 if old.role_slug='super_admin' and old.is_active then
  if tg_op='DELETE' then raise exception 'staff_owner_protected';end if;
  if new.user_id<>old.user_id or new.role_slug<>old.role_slug or not new.is_active then raise exception 'staff_owner_protected';end if;
 end if;
 if tg_op='DELETE' then return old;end if;return new;
end;$$;
revoke all on function app_private.protect_staff_owner() from public,anon,authenticated;
create trigger staff_owner_protected before update or delete on public.staff_profiles for each row execute function app_private.protect_staff_owner();

create table app_private.staff_access_receipts(
 actor_user_id uuid not null references auth.users(id) on delete cascade, request_id uuid not null,
 input_hash text not null,result jsonb not null,created_at timestamptz not null default now(),primary key(actor_user_id,request_id)
);
alter table app_private.staff_access_receipts enable row level security;
revoke all on app_private.staff_access_receipts from public,anon,authenticated;

create function app_private.staff_directory(p_before uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_items jsonb;v_roles jsonb;v_audit jsonb;begin
 perform app_private.staff_require_permission('staff.manage');
 if not app_private.is_super_admin() then raise exception 'staff_access_required';end if;
 select coalesce(jsonb_agg(to_jsonb(x) order by x."userId"),'[]') into v_items from (
  select s.user_id as "userId",u.email,coalesce(p.display_name,'') as name,s.role_slug as role,r.name as "roleName",s.is_active as active,s.access_revision as revision
  from public.staff_profiles s join auth.users u on u.id=s.user_id join public.profiles p on p.id=s.user_id join public.roles r on r.slug=s.role_slug
  where p_before is null or s.user_id>p_before order by s.user_id limit 51
 ) x;
 select coalesce(jsonb_agg(jsonb_build_object('slug',r.slug,'name',r.name,'description',r.description,'permissions',
  (select jsonb_agg(permission_slug order by permission_slug) from public.role_permissions where role_slug=r.slug)) order by r.slug),'[]') into v_roles
 from public.roles r where r.slug in ('super_admin','cod_verifier','catalog_manager');
 select coalesce(jsonb_agg(to_jsonb(x) order by x.id::bigint desc),'[]') into v_audit from (
  select id::text,action,entity_id as "userId",created_at as "createdAt",after_data->>'note' as reason,
   after_data->>'role' as role,after_data->>'active' as active
  from public.audit_logs where entity_type='staff' and action like 'staff.%' order by audit_logs.id desc limit 20
 ) x;
 return jsonb_build_object('items',(select coalesce(jsonb_agg(x.value order by x.ordinality),'[]') from jsonb_array_elements(v_items) with ordinality x where x.ordinality<=50),
  'nextCursor',case when jsonb_array_length(v_items)>50 then v_items->49->>'userId' else null end,'roles',v_roles,'audit',v_audit);
end;$$;
revoke all on function app_private.staff_directory(uuid) from public,anon;
grant execute on function app_private.staff_directory(uuid) to authenticated;
create function public.staff_directory(p_before uuid default null) returns jsonb language sql security invoker set search_path='' as $$select app_private.staff_directory(p_before);$$;
revoke all on function public.staff_directory(uuid) from public,anon;
grant execute on function public.staff_directory(uuid) to authenticated;

create function app_private.staff_access_action(p_request_id uuid,p_input jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_action text;v_note text;v_role text;v_email text;v_user uuid;v_active boolean;v_expected integer;v_hash text;v_result jsonb;
 v_before jsonb;s public.staff_profiles%rowtype;r app_private.staff_access_receipts%rowtype;
begin
 perform pg_advisory_xact_lock(hashtextextended('dwellune.staff.access',0));
 perform app_private.staff_require_permission('staff.manage');
 if not app_private.is_super_admin() then raise exception 'staff_access_required';end if;
 if p_request_id is null or jsonb_typeof(p_input) is distinct from 'object' then raise exception 'invalid_staff_input';end if;
 v_action:=p_input->>'action';v_note:=trim(p_input->>'note');v_role:=p_input->>'role';
 if v_action is null or v_action not in ('assign','update') or jsonb_typeof(p_input->'note') is distinct from 'string' or length(v_note) not between 3 and 1000
  or v_role is null or v_role not in ('cod_verifier','catalog_manager') then raise exception 'invalid_staff_input';end if;
 if v_action='assign' then
  if (select count(*) from jsonb_object_keys(p_input))<>4 or exists(select 1 from jsonb_object_keys(p_input) k where k not in ('action','email','role','note'))
   or jsonb_typeof(p_input->'email') is distinct from 'string' or length(trim(p_input->>'email')) not between 3 and 254 then raise exception 'invalid_staff_input';end if;
 else
  if (select count(*) from jsonb_object_keys(p_input))<>6 or exists(select 1 from jsonb_object_keys(p_input) k where k not in ('action','userId','role','active','expectedRevision','note'))
   or jsonb_typeof(p_input->'active') is distinct from 'boolean' or jsonb_typeof(p_input->'expectedRevision') is distinct from 'number'
   or (p_input->>'expectedRevision') !~ '^[0-9]{1,9}$' or jsonb_typeof(p_input->'userId') is distinct from 'string'
   or (p_input->>'userId') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then raise exception 'invalid_staff_input';end if;
 end if;
 v_hash:=encode(extensions.digest(p_input::text,'sha256'),'hex');
 select * into r from app_private.staff_access_receipts where actor_user_id=auth.uid() and request_id=p_request_id;
 if found then if r.input_hash<>v_hash then raise exception 'staff_request_conflict';end if;return r.result;end if;
 if v_action='assign' then
  v_email:=lower(trim(p_input->>'email'));
  select u.id into v_user from auth.users u join public.customers c on c.user_id=u.id and c.status='active'
   join public.profiles p on p.id=u.id where lower(u.email)=v_email and not coalesce(u.is_anonymous,false)
   and (u.banned_until is null or u.banned_until<=now());
  if v_user is null then raise exception 'staff_account_unavailable';end if;
  if v_user=auth.uid() then raise exception 'staff_owner_protected';end if;
  if exists(select 1 from public.staff_profiles where user_id=v_user) then raise exception 'staff_already_assigned';end if;
  insert into public.staff_profiles(user_id,role_slug,is_active,access_revision,access_valid_after)
   values(v_user,v_role,true,1,clock_timestamp());
 else
  v_user:=(p_input->>'userId')::uuid;v_expected:=(p_input->>'expectedRevision')::integer;v_active:=(p_input->>'active')::boolean;
  select * into s from public.staff_profiles where user_id=v_user for update;
  if not found then raise exception 'staff_account_unavailable';end if;
  if v_user=auth.uid() or s.role_slug='super_admin' then raise exception 'staff_owner_protected';end if;
  if s.access_revision<>v_expected then raise exception 'staff_changed';end if;
  if s.role_slug=v_role and s.is_active=v_active then raise exception 'staff_no_change';end if;
  v_before:=jsonb_build_object('role',s.role_slug,'active',s.is_active,'revision',s.access_revision);
  update public.staff_profiles set role_slug=v_role,is_active=v_active,access_revision=access_revision+1,access_valid_after=clock_timestamp() where user_id=v_user;
 end if;
 select jsonb_build_object('userId',user_id,'role',role_slug,'active',is_active,'revision',access_revision) into v_result from public.staff_profiles where user_id=v_user;
 insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,before_data,after_data,request_id)
 values(auth.uid(),'staff.'||v_action,'staff',v_user,v_before,v_result||jsonb_build_object('note',v_note),p_request_id::text);
 insert into app_private.staff_access_receipts(actor_user_id,request_id,input_hash,result) values(auth.uid(),p_request_id,v_hash,v_result);
 return v_result;
end;$$;
revoke all on function app_private.staff_access_action(uuid,jsonb) from public,anon;
grant execute on function app_private.staff_access_action(uuid,jsonb) to authenticated;
create function public.staff_access_action(p_request_id uuid,p_input jsonb) returns jsonb language sql security invoker set search_path='' as $$select app_private.staff_access_action(p_request_id,p_input);$$;
revoke all on function public.staff_access_action(uuid,jsonb) from public,anon;
grant execute on function public.staff_access_action(uuid,jsonb) to authenticated;

-- Existing verification business rules remain unchanged; use the limited permission.
create or replace function app_private.staff_verification_detail_base(p_order_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare o public.orders%rowtype;v_order jsonb;v_items jsonb;v_address jsonb;v_attempts jsonb;v_history jsonb;v_shipment boolean;
begin
 if auth.uid() is null or not app_private.account_session_valid() then raise exception 'authentication_required';end if;
 if not app_private.staff_has_permission('verification.manage') then raise exception 'staff_access_required';end if;
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
end; $$;
create or replace function app_private.staff_verification_action_base(p_order_id uuid,p_request_id uuid,p_input jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare o public.orders%rowtype;r app_private.staff_verification_receipts%rowtype;v_hash text;v_action text;v_note text;v_channel text;v_outcome text;v_attempt int;v_next public.order_status;v_verify public.verification_status;v_result jsonb;
begin
 if auth.uid() is null or not app_private.account_session_valid() then raise exception 'authentication_required';end if;
 perform app_private.staff_require_permission('verification.manage');
 -- Prevent role revocation during this authorized transaction.
 perform 1 from public.staff_profiles where user_id=auth.uid() and is_active for share;
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
 select * into r from app_private.staff_verification_receipts where actor_user_id=auth.uid() and request_id=p_request_id;
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
 insert into app_private.staff_verification_receipts(actor_user_id,request_id,order_id,input_hash,result) values(auth.uid(),p_request_id,o.id,v_hash,v_result);
 return v_result;
end; $$;
create or replace function app_private.staff_verification_action(p_order_id uuid,p_request_id uuid,p_input jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare o public.orders%rowtype;r app_private.staff_verification_receipts%rowtype;v_hash text;v_action text;v_note text;v_result jsonb;
begin
 if auth.uid() is null or not app_private.account_session_valid() then raise exception 'authentication_required';end if;
 perform app_private.staff_require_permission('verification.manage');
 perform 1 from public.staff_profiles where user_id=auth.uid() and is_active for share;
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
create or replace function app_private.staff_verification_queue(p_filter text default 'pending',p_before uuid default null)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_before timestamptz;v_rows jsonb;v_items jsonb;
begin
 if auth.uid() is null or not app_private.account_session_valid() then raise exception 'authentication_required';end if;
 if not app_private.staff_has_permission('verification.manage') then raise exception 'staff_access_required';end if;
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

-- Staff inboxes remain recipient-scoped. Broader delivery controls stay owner-only.
create or replace function app_private.notification_owned(p_audience text,p_user uuid,p_customer uuid) returns boolean language sql stable security definer set search_path='' as $$
 select app_private.account_session_valid() and case when p_audience='staff' then p_user=auth.uid() and app_private.staff_has_permission('notifications.view')
 else exists(select 1 from public.customers where user_id=auth.uid() and status='active') and (p_user=auth.uid() or exists(select 1 from public.customers where id=p_customer and user_id=auth.uid() and status='active')) end;
$$;
create or replace function app_private.notification_guard(p_audience text) returns void language plpgsql security definer set search_path='' as $$begin
 if not app_private.account_session_valid() then raise exception 'authentication_required';end if;
 if p_audience is null or p_audience not in ('customer','staff') then raise exception 'invalid_notification_input';end if;
 if p_audience='staff' then perform app_private.staff_require_permission('notifications.view');
 elsif not exists(select 1 from public.customers where user_id=auth.uid() and status='active') then raise exception 'account_unavailable';end if;
end;$$;

-- New staff receive only events relevant to their role, with existing receipt deduplication.
create or replace function app_private.emit_notification(p_key text,p_event uuid,p_audience text,p_entity text,p_entity_id uuid,p_customer uuid default null) returns int language plpgsql security definer set search_path='' as $$
declare t app_private.notification_types%rowtype;r record;v_claim uuid;v_notice uuid;v_allowed boolean;v_count int:=0;
begin
 select * into t from app_private.notification_types where event_key=p_key and audience=p_audience and state='active';if not found or p_event is null then raise exception 'notification_event_inactive';end if;
 for r in select user_id as id from public.staff_profiles s where p_audience='staff' and s.is_active and exists(select 1 from public.customers c where c.user_id=s.user_id and c.status='active')
 and exists(select 1 from public.role_permissions rp where rp.role_slug=s.role_slug and rp.permission_slug='notifications.view')
 and exists(select 1 from public.role_permissions rp where rp.role_slug=s.role_slug and rp.permission_slug=
  case when t.category in ('orders','verification') then 'verification.manage' when t.category='inventory' then 'inventory.manage' when t.category='returns' then 'returns.manage' else 'notifications.manage' end)
 union all select id from public.customers where p_audience='customer' and id=p_customer and status='active' loop
  v_allowed:=t.required or coalesce((select in_app_product_updates from public.notification_preferences where customer_id=r.id),false);
  v_claim:=null;
  insert into app_private.notification_event_receipts(event_key,event_id,audience,recipient_id,outcome) values(p_key,p_event,p_audience,r.id,case when v_allowed then 'recorded' else 'suppressed' end) on conflict do nothing returning recipient_id into v_claim;
  if v_claim is null or not v_allowed then continue;end if;
  insert into public.notifications(audience,recipient_user_id,recipient_customer_id,event_key,title,body,priority,entity_type,entity_id)
  values(p_audience,case when p_audience='staff' then r.id end,case when p_audience='customer' then r.id end,p_key,t.title,t.body,t.priority,p_entity,p_entity_id) returning id into v_notice;
  update app_private.notification_event_receipts set notification_id=v_notice where event_key=p_key and event_id=p_event and audience=p_audience and recipient_id=r.id;v_count:=v_count+1;
 end loop;return v_count;
end;$$;
