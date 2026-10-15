create function app_private.enqueue_transactional_email(p_order uuid,p_key text,p_event uuid,p_return uuid default null) returns uuid language plpgsql security definer set search_path='' as $$
declare o public.orders%rowtype;r record;v_text text;v_subject text;v_notice uuid;v_job uuid;
begin
 if p_key not in ('order.verification_required','order.confirmed','order.cancelled','return.requested') or p_event is null then raise exception 'email_event_inactive';end if;
 select * into o from public.orders where id=p_order;if not found then raise exception 'order_unavailable';end if;
 -- Historic/imported rows may have no email. Checkout itself validates contact email.
 if o.contact_email is null then return null;end if;
 v_subject:='DWELLUNE — Order '||o.order_number||case p_key when 'order.verification_required' then ' awaits verification' when 'order.confirmed' then ' confirmed' when 'order.cancelled' then ' cancelled' else ' return request received' end;
 v_text:='Order #'||o.order_number||E'\n\n';
 if p_key='return.requested' then
  select * into r from public.returns where id=p_return and order_id=o.id;if not found then raise exception 'return_unavailable';end if;
  v_text:=v_text||'Return request #'||r.return_number||E'\n\n';
 end if;
 for r in select * from public.order_items where order_id=o.id order by created_at,id loop
  v_text:=v_text||r.product_name||' / '||r.variant_name||' × '||r.quantity||' — PKR '||r.line_total_pkr||E'\n';
 end loop;
 if p_key in ('order.confirmed','order.verification_required') then
  v_text:=v_text||E'\nSubtotal: PKR '||o.subtotal_pkr||E'\nDiscount: PKR '||o.discount_pkr||E'\nDelivery: PKR '||o.shipping_pkr||E'\nDue on delivery: PKR '||o.total_pkr||E'\n\nNo online payment is required.';
 end if;
 -- Link only an owned customer notice; never a staff notice/private note.
 select id into v_notice from public.notifications where audience='customer' and recipient_customer_id=o.customer_id and event_key=p_key and entity_id=case when p_key='return.requested' then p_return else o.id end order by created_at desc,id desc limit 1;
 insert into app_private.order_email_outbox(order_id,notification_id,event_key,event_id,payload)
 values(o.id,v_notice,p_key,p_event,jsonb_build_object('to',jsonb_build_array(o.contact_email::text),'subject',v_subject,'text',v_text)) returning id into v_job;
 if v_job is not null and v_notice is not null then
  insert into public.notification_deliveries(notification_id,channel,status,provider) values(v_notice,'email','pending','gmail_smtp') on conflict(notification_id,channel) do nothing;
 end if;return v_job;
end;$$;
revoke all on function app_private.enqueue_transactional_email(uuid,text,uuid,uuid) from public,anon,authenticated;
