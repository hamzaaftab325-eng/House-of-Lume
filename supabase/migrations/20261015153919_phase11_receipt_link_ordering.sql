-- Claim the durable receipt before the job; attach its FK only after the job exists.
-- This works with immediate constraints as well as deferred event triggers.
create or replace function app_private.prepare_event_email() returns trigger language plpgsql security definer set search_path='' as $$
declare v_claim uuid;
begin
 if jsonb_array_length(new.payload->'to')<>1 or coalesce(new.payload->'to'->>0,'') !~ '^[^[:space:]<>@]+@[^[:space:]<>@]+\.[^[:space:]<>@]+$' then raise exception 'invalid_email_recipient';end if;
 new.event_id:=coalesce(new.event_id,new.order_id);
 new.recipient_hash:=encode(extensions.digest(lower(new.payload->'to'->>0),'sha256'),'hex');
 new.template_version:='v2';
 new.payload:=new.payload||jsonb_build_object('event',new.event_key,'version',new.template_version);
 insert into app_private.email_event_receipts(event_key,event_id,recipient_hash,template_version,job_id) values(new.event_key,new.event_id,new.recipient_hash,new.template_version,null) on conflict do nothing returning event_id into v_claim;
 if v_claim is null then return null;end if;return new;
end;$$;
revoke all on function app_private.prepare_event_email() from public,anon,authenticated;

create function app_private.attach_email_receipt() returns trigger language plpgsql security definer set search_path='' as $$begin
 update app_private.email_event_receipts set job_id=new.id where event_key=new.event_key and event_id=new.event_id and recipient_hash=new.recipient_hash and job_id is null;
 return new;
end;$$;
revoke all on function app_private.attach_email_receipt() from public,anon,authenticated;
create trigger order_email_attach_receipt after insert on app_private.order_email_outbox for each row execute function app_private.attach_email_receipt();

-- The checkout confirmation reports the original receipt, not later status emails.
create unique index order_email_placed_once_idx on app_private.order_email_outbox(order_id) where event_key='order.placed';
create or replace function app_private.checkout_confirmation(p_order_id uuid,p_guest_hash text) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_customer uuid; v_order public.orders%rowtype; v_receipt app_private.checkout_receipts%rowtype; v_lines jsonb;
begin
 if auth.uid() is not null then v_customer:=app_private.commerce_customer_id(); if v_customer is null then raise exception 'authentication_required'; end if; end if;
 select * into v_receipt from app_private.checkout_receipts where order_id=p_order_id;
 if v_receipt.order_id is null or not ((v_customer is not null and v_receipt.customer_id=v_customer) or (auth.uid() is null and app_private.commerce_valid_guest_hash(p_guest_hash) and v_receipt.guest_hash=p_guest_hash)) then raise exception 'order_unavailable'; end if;
 select * into v_order from public.orders where id=p_order_id;
 select coalesce(jsonb_agg(jsonb_build_object('name',product_name,'variant',variant_name,'quantity',quantity,'unit_price_pkr',unit_price_pkr,'line_total_pkr',line_total_pkr) order by created_at,id),'[]') into v_lines from public.order_items where order_id=p_order_id;
 return jsonb_build_object('id',v_order.id,'order_number',v_order.order_number,'authenticated',v_customer is not null,'status',v_order.status,'verification_status',v_order.verification_status,'payment_method','cash_on_delivery','placed_at',v_order.placed_at,'subtotal_pkr',v_order.subtotal_pkr,'discount_pkr',v_order.discount_pkr,'shipping_pkr',v_order.shipping_pkr,'tax_pkr',v_order.tax_pkr,'total_pkr',v_order.total_pkr,'lines',v_lines,'email_status',(select status from app_private.order_email_outbox where order_id=p_order_id and event_key='order.placed' order by created_at,id limit 1));
end; $$;
