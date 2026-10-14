-- Phase 9 Part 1: protected manual COD verification; no automated outbound contact.
alter table public.orders add column verification_revision bigint not null default 0 check(verification_revision>=0);
alter table public.cod_verifications add column contact_channel text check(contact_channel in ('phone','whatsapp','email','admin'));
alter table public.cod_verifications add column contact_outcome text check(contact_outcome in ('reached','no_response','failed'));
alter table public.cod_verifications add column staff_action text check(staff_action in ('contact','confirm','reject','cancel'));
-- Customers can see order status, not internal contact notes or staff identity.
revoke all on public.cod_verifications from anon,authenticated;
create table app_private.staff_verification_receipts (
 actor_user_id uuid not null references auth.users(id),
 request_id uuid not null,
 order_id uuid not null references public.orders(id),
 input_hash text not null,
 result jsonb not null,
 created_at timestamptz not null default now(),
 primary key(actor_user_id,request_id)
);
alter table app_private.staff_verification_receipts enable row level security;
revoke all on app_private.staff_verification_receipts from public,anon,authenticated;
create index staff_verification_receipts_order_idx on app_private.staff_verification_receipts(order_id);
create index orders_verification_queue_idx on public.orders(placed_at desc,id desc) where status='pending_verification';

create function app_private.staff_verification_queue(p_filter text default 'pending',p_before uuid default null)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_before timestamptz;v_rows jsonb;v_items jsonb;
begin
 if auth.uid() is null or not app_private.account_session_valid() then raise exception 'authentication_required';end if;
 if not app_private.is_super_admin() then raise exception 'staff_access_required';end if;
 if p_filter is null or p_filter not in ('pending','confirmed','cancelled','all') then raise exception 'invalid_queue_filter';end if;
 if p_before is not null then select placed_at into v_before from public.orders where id=p_before;if not found then raise exception 'invalid_queue_cursor';end if;end if;
 select coalesce(jsonb_agg(to_jsonb(q) order by placed_at desc,id desc),'[]') into v_rows from (
  select o.id,o.order_number,o.contact_name,o.contact_phone,o.status,o.verification_status,o.total_pkr,o.placed_at,
   (select a.city from public.order_addresses a where a.order_id=o.id limit 1) as city
  from public.orders o where (p_filter='all' or o.status::text=case when p_filter='pending' then 'pending_verification' else p_filter end)
  and (p_before is null or (o.placed_at,o.id)<(v_before,p_before)) order by o.placed_at desc,o.id desc limit 21
 ) q;
 select coalesce(jsonb_agg(value order by ordinality),'[]') into v_items from jsonb_array_elements(v_rows) with ordinality where ordinality<=20;
 return jsonb_build_object('items',v_items,'next_cursor',case when jsonb_array_length(v_rows)>20 then v_rows->19->>'id' else null end);
end; $$;
create function app_private.staff_verification_detail(p_order_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare o public.orders%rowtype;v_order jsonb;v_items jsonb;v_address jsonb;v_attempts jsonb;v_history jsonb;v_shipment boolean;
begin
 if auth.uid() is null or not app_private.account_session_valid() then raise exception 'authentication_required';end if;
 if not app_private.is_super_admin() then raise exception 'staff_access_required';end if;
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

create function app_private.staff_verification_action(p_order_id uuid,p_request_id uuid,p_input jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare o public.orders%rowtype;r app_private.staff_verification_receipts%rowtype;v_hash text;v_action text;v_note text;v_channel text;v_outcome text;v_attempt int;v_next public.order_status;v_verify public.verification_status;v_result jsonb;
begin
 if auth.uid() is null or not app_private.account_session_valid() then raise exception 'authentication_required';end if;
 if not app_private.is_super_admin() then raise exception 'staff_access_required';end if;
 -- Prevent role revocation during this authorized transaction.
 perform 1 from public.staff_profiles where user_id=auth.uid() and is_active and role_slug='super_admin' for share;
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

revoke all on function app_private.staff_verification_queue(text,uuid),app_private.staff_verification_detail(uuid),app_private.staff_verification_action(uuid,uuid,jsonb) from public,anon;
grant execute on function app_private.staff_verification_queue(text,uuid),app_private.staff_verification_detail(uuid),app_private.staff_verification_action(uuid,uuid,jsonb) to authenticated;
create function public.staff_verification_queue(p_filter text default 'pending',p_before uuid default null) returns jsonb language sql security invoker set search_path='' as $$select app_private.staff_verification_queue(p_filter,p_before);$$;
create function public.staff_verification_detail(p_order_id uuid) returns jsonb language sql security invoker set search_path='' as $$select app_private.staff_verification_detail(p_order_id);$$;
create function public.staff_verification_action(p_order_id uuid,p_request_id uuid,p_input jsonb) returns jsonb language sql security invoker set search_path='' as $$select app_private.staff_verification_action(p_order_id,p_request_id,p_input);$$;
revoke all on function public.staff_verification_queue(text,uuid),public.staff_verification_detail(uuid),public.staff_verification_action(uuid,uuid,jsonb) from public,anon;
grant execute on function public.staff_verification_queue(text,uuid),public.staff_verification_detail(uuid),public.staff_verification_action(uuid,uuid,jsonb) to authenticated;
