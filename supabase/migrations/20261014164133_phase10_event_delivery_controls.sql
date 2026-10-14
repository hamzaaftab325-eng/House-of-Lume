-- Event registry describes only real workflow coverage. Deferred entries cannot emit.
create table app_private.notification_types(event_key text not null,audience text not null check(audience in ('customer','staff')),category text not null,priority public.notification_priority not null default 'normal',required boolean not null default true,state text not null check(state in ('active','deferred')),title text not null,body text not null,dependency text,primary key(event_key,audience));
alter table app_private.notification_types enable row level security;
revoke all on app_private.notification_types from public,anon,authenticated;
insert into app_private.notification_types(event_key,audience,category,priority,required,state,title,body,dependency) values
('order.placed','customer','orders','normal',true,'active','Order received','Your Cash on Delivery order has been received.',null),
('order.placed','staff','orders','high',true,'active','New COD order','A new COD order requires processing.',null),
('order.verification_required','customer','verification','normal',true,'active','Order awaiting verification','The store will review your COD order before fulfillment.',null),
('order.verification_required','staff','verification','high',true,'active','COD verification required','A COD order is awaiting verification.',null),
('order.confirmed','customer','orders','normal',true,'active','Order confirmed','Your COD order is confirmed.',null),
('order.cancelled','customer','orders','normal',true,'active','Order cancelled','Your order has been cancelled.',null),
('order.review_required','staff','verification','high',true,'active','Manual review required','An order has recorded signals requiring manual review.',null),
('inventory.low_stock','staff','inventory','high',true,'active','Low stock','Available inventory has entered the low-stock range.',null),
('inventory.out_of_stock','staff','inventory','critical',true,'active','Out of stock','Available inventory has reached zero.',null),
('return.requested','customer','returns','normal',true,'active','Return request received','Your return request has been recorded for store review.',null),
('return.requested','staff','returns','high',true,'active','Return request','A customer has requested a return.',null),
('order.email_failed','staff','operations','high',true,'active','Order email requires attention','Review the email delivery status before taking action.',null),
('email.health_failed','staff','operations','critical',true,'active','Email authentication requires attention','The latest SMTP verification failed. Check the sender configuration.',null);
insert into app_private.notification_types(event_key,audience,category,priority,required,state,title,body,dependency)
select 'order.'||x,'customer','orders','normal',true,'deferred','Order update','Your order has an update.','Validated fulfillment workflow' from unnest(array['packed','shipped','out_for_delivery','delivered','delivery_failed']) x;
insert into app_private.notification_types(event_key,audience,category,priority,required,state,title,body,dependency) values
('return.updated','customer','returns','normal',true,'deferred','Return update','Your return has an update.','Return decision/receipt workflow'),
('order.rto_updated','customer','returns','normal',true,'deferred','Delivery return update','Your delivery has a return update.','Validated RTO workflow'),
('product.back_in_stock','customer','products','normal',false,'deferred','Product available','A saved product is available again.','Product subscription and replenishment workflow'),
('order.delivery_failed','staff','orders','high',true,'deferred','Delivery failure','A delivery requires attention.','Validated delivery workflow'),
('rto.initiated','staff','returns','high',true,'deferred','RTO initiated','A shipment is returning.','Validated RTO workflow'),
('review.pending','staff','operations','normal',true,'deferred','Review requires moderation','A review awaits moderation.','Review submission/moderation workflow'),
('support.escalated','staff','operations','high',true,'deferred','Support escalation','A support case requires attention.','Support escalation workflow'),
('settlement.discrepancy','staff','operations','critical',true,'deferred','Settlement discrepancy','A COD settlement requires attention.','COD settlement/reconciliation workflow'),
('job.failed','staff','operations','high',true,'deferred','Background job failed','A background job requires attention.','General durable job producer');
alter table public.notification_preferences add column in_app_product_updates boolean not null default false;
update public.notification_preferences set in_app_order_updates=true,email_order_updates=true;
alter table public.notification_preferences add constraint notification_essential_enabled check(in_app_order_updates and email_order_updates);
revoke update(in_app_order_updates,email_order_updates) on public.notification_preferences from authenticated;
-- Part 1's audience filter needs an explicit grant because Phase 7 uses column grants.
grant select(audience) on public.notifications to authenticated;
create table app_private.notification_event_receipts(event_key text not null,event_id uuid not null,audience text not null,recipient_id uuid not null,notification_id uuid references public.notifications(id) on delete set null,outcome text not null check(outcome in ('recorded','suppressed')),created_at timestamptz not null default now(),primary key(event_key,event_id,audience,recipient_id));
create index notification_event_receipts_notice_idx on app_private.notification_event_receipts(notification_id) where notification_id is not null;
alter table app_private.notification_event_receipts enable row level security;
revoke all on app_private.notification_event_receipts from public,anon,authenticated;
create function app_private.emit_notification(p_key text,p_event uuid,p_audience text,p_entity text,p_entity_id uuid,p_customer uuid default null) returns int language plpgsql security definer set search_path='' as $$
declare t app_private.notification_types%rowtype;r record;v_claim uuid;v_notice uuid;v_allowed boolean;v_count int:=0;
begin
 select * into t from app_private.notification_types where event_key=p_key and audience=p_audience and state='active';if not found or p_event is null then raise exception 'notification_event_inactive';end if;
 for r in select user_id as id from public.staff_profiles where p_audience='staff' and is_active and role_slug='super_admin'
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
revoke all on function app_private.emit_notification(text,uuid,text,text,uuid,uuid) from public,anon,authenticated;
create function app_private.record_in_app_delivery() returns trigger language plpgsql security definer set search_path='' as $$begin
 insert into public.notification_deliveries(notification_id,channel,status,provider,sent_at,attempt_count) values(new.id,'in_app','sent','database',now(),1) on conflict(notification_id,channel) do nothing;return new;
end;$$;
revoke all on function app_private.record_in_app_delivery() from public,anon,authenticated;
create trigger notifications_in_app_delivery after insert on public.notifications for each row execute function app_private.record_in_app_delivery();
insert into public.notification_deliveries(notification_id,channel,status,provider,sent_at,attempt_count) select id,'in_app','sent','database',created_at,1 from public.notifications on conflict(notification_id,channel) do nothing;
create function app_private.order_verification_notice() returns trigger language plpgsql security definer set search_path='' as $$begin
 if new.status='pending_verification' then perform app_private.emit_notification('order.verification_required',new.id,'staff','order',new.id);if new.customer_id is not null then perform app_private.emit_notification('order.verification_required',new.id,'customer','order',new.id,new.customer_id);end if;end if;return new;
end;$$;
revoke all on function app_private.order_verification_notice() from public,anon,authenticated;
create trigger orders_verification_notice after insert on public.orders for each row execute function app_private.order_verification_notice();
create function app_private.return_requested_notice() returns trigger language plpgsql security definer set search_path='' as $$begin
 if new.status='requested' then perform app_private.emit_notification('return.requested',new.id,'staff','return',new.id);if new.customer_id is not null then perform app_private.emit_notification('return.requested',new.id,'customer','return',new.id,new.customer_id);end if;end if;return new;
end;$$;
revoke all on function app_private.return_requested_notice() from public,anon,authenticated;
create trigger returns_requested_notice after insert on public.returns for each row execute function app_private.return_requested_notice();
create table app_private.inventory_notice_state(variant_id uuid not null references public.product_variants(id) on delete cascade,location_id uuid not null references public.inventory_locations(id),band text not null,episode uuid not null,primary key(variant_id,location_id));
create index inventory_notice_state_location_idx on app_private.inventory_notice_state(location_id);
alter table app_private.inventory_notice_state enable row level security;
revoke all on app_private.inventory_notice_state from public,anon,authenticated;
create function app_private.inventory_threshold_notice() returns trigger language plpgsql security definer set search_path='' as $$
declare v_band text;v_old text;v_event uuid;v_product uuid;
begin
 select p.id into v_product from public.product_variants v join public.products p on p.id=v.product_id where v.id=new.variant_id and v.status='active' and v.track_inventory and p.status='active' and p.published_at<=now() and coalesce(p.specifications->>'test_product','false')<>'true';if v_product is null then return new;end if;
 v_band:=case when new.available=0 then 'out' when new.available<=new.low_stock_threshold then 'low' else 'healthy' end;
 select band into v_old from app_private.inventory_notice_state where variant_id=new.variant_id and location_id=new.location_id for update;
 if v_old is not distinct from v_band then return new;end if;
 v_event:=gen_random_uuid();insert into app_private.inventory_notice_state values(new.variant_id,new.location_id,v_band,v_event) on conflict(variant_id,location_id) do update set band=excluded.band,episode=excluded.episode;
 if v_band<>'healthy' then
  perform app_private.emit_notification(case when v_band='out' then 'inventory.out_of_stock' else 'inventory.low_stock' end,v_event,'staff','product',v_product);
  update public.notifications n set body='SKU '||(select sku from public.product_variants where id=new.variant_id)||' at '||(select code from public.inventory_locations where id=new.location_id)||': available '||new.available||', low-stock threshold '||new.low_stock_threshold||'.' from app_private.notification_event_receipts r where r.notification_id=n.id and r.event_id=v_event and r.audience='staff';
 end if;return new;
end;$$;
revoke all on function app_private.inventory_threshold_notice() from public,anon,authenticated;
create trigger inventory_threshold_notice after insert or update of on_hand,reserved,low_stock_threshold on public.inventory_balances for each row execute function app_private.inventory_threshold_notice();
create function app_private.smtp_health_notice() returns trigger language plpgsql security definer set search_path='' as $$begin
 if new.last_error_code='smtp_verification_failed' and old.last_error_code is distinct from new.last_error_code then perform app_private.emit_notification('email.health_failed',gen_random_uuid(),'staff','job',null);end if;return new;
end;$$;
revoke all on function app_private.smtp_health_notice() from public,anon,authenticated;
create trigger smtp_health_notice after update on app_private.order_email_worker_state for each row execute function app_private.smtp_health_notice();
create or replace function app_private.notification_category(p_event text,p_entity text) returns text language sql stable security definer set search_path='' as $$
 select coalesce((select category from app_private.notification_types where event_key=p_event order by audience limit 1),case when p_entity='order' then 'orders' when p_entity in ('return','rto') then 'returns' when p_entity='product' then 'products' when p_entity in ('account','customer','profile') then 'account' else 'operations' end);
$$;
create function app_private.notification_preferences(p_values jsonb default null) returns jsonb language plpgsql security definer set search_path='' as $$declare v_customer uuid;r public.notification_preferences%rowtype;begin
 perform app_private.notification_guard('customer');select id into v_customer from public.customers where user_id=auth.uid() and status='active';
 if p_values is not null then
  if jsonb_typeof(p_values) is distinct from 'object' or (select count(*) from jsonb_object_keys(p_values))<>2 or jsonb_typeof(p_values->'productUpdates') is distinct from 'boolean' or jsonb_typeof(p_values->'emailMarketing') is distinct from 'boolean' then raise exception 'invalid_notification_input';end if;
  insert into public.notification_preferences(customer_id,in_app_product_updates,email_marketing) values(v_customer,(p_values->>'productUpdates')::boolean,(p_values->>'emailMarketing')::boolean) on conflict(customer_id) do update set in_app_product_updates=excluded.in_app_product_updates,email_marketing=excluded.email_marketing;
 end if;
 select * into r from public.notification_preferences where customer_id=v_customer;
 return jsonb_build_object('productUpdates',coalesce(r.in_app_product_updates,false),'emailMarketing',coalesce(r.email_marketing,false),'essentialUpdates',true);
end;$$;
create function app_private.notification_operations(p_status text default 'all') returns jsonb language plpgsql security definer set search_path='' as $$declare v_types jsonb;v_jobs jsonb;v_health jsonb;v_counts jsonb;begin
 perform app_private.notification_guard('staff');if p_status is null or p_status not in ('all','pending','sending','sent','failed') then raise exception 'invalid_notification_input';end if;
 select jsonb_agg(jsonb_build_object('key',event_key,'audience',audience,'category',category,'required',required,'state',state,'dependency',dependency) order by audience,event_key) into v_types from app_private.notification_types;
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'order_id',order_id,'status',status,'attempts',attempt_count,'error',last_error_code,'next_attempt',next_attempt_at,'created_at',created_at) order by created_at desc,id desc),'[]') into v_jobs from(select * from app_private.order_email_outbox where p_status='all' or status=p_status order by created_at desc,id desc limit 20) x;
 select jsonb_build_object('verified_at',verified_at,'last_run_at',last_run_at,'error',last_error_code) into v_health from app_private.order_email_worker_state where singleton;
 select jsonb_build_object('pending',count(*) filter(where status='pending'),'sending',count(*) filter(where status='sending'),'failed',count(*) filter(where status='failed'),'sent',count(*) filter(where status='sent')) into v_counts from app_private.order_email_outbox;
 return jsonb_build_object('types',v_types,'jobs',v_jobs,'health',v_health,'counts',v_counts);
end;$$;
revoke all on function app_private.notification_preferences(jsonb),app_private.notification_operations(text) from public,anon;
grant execute on function app_private.notification_preferences(jsonb),app_private.notification_operations(text) to authenticated;
create function public.notification_preferences(p_values jsonb default null) returns jsonb language sql security invoker set search_path='' as $$select app_private.notification_preferences(p_values);$$;
create function public.notification_operations(p_status text default 'all') returns jsonb language sql security invoker set search_path='' as $$select app_private.notification_operations(p_status);$$;
revoke all on function public.notification_preferences(jsonb),public.notification_operations(text) from public,anon;
grant execute on function public.notification_preferences(jsonb),public.notification_operations(text) to authenticated;
