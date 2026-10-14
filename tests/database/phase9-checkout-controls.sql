begin;
-- Transaction-local gate/health setup only: uncommitted rows are invisible to the email worker.
update public.system_settings set value='true'::jsonb where key='checkout.orders_enabled';
update public.system_settings set value='false'::jsonb where key='cod.verification_required';
update app_private.cod_review_policy set verification_required=false;
update app_private.order_email_worker_state set verified_at=now() where singleton;
insert into public.products(id,product_type,status,name,slug,published_at) values('98100000-0000-4000-8000-000000000001','lamp','active','Rollback review order fixture','p9c-rollback-review-lamp',now());
insert into public.product_variants(id,product_id,sku,title,price_pkr,track_inventory) values('98200000-0000-4000-8000-000000000001','98100000-0000-4000-8000-000000000001','P9C-ROLLBACK','Fixture',30000,true);
insert into public.inventory_balances(variant_id,location_id,on_hand) select '98200000-0000-4000-8000-000000000001',id,10 from public.inventory_locations where code='MAIN-PK';
select set_config('request.jwt.claims','{}',true);
do $$ declare v_input jsonb:='{"name":"Rollback review","email":"rollback@example.invalid","phone":"03009876543","address":{"line1":"123 Rollback Street","line2":"","city":"Lahore","province":"Punjab","postalCode":"54000","country":"PK"},"notes":"","terms":true}';v_rev text;v_result jsonb;v_id uuid;begin
 if not public.checkout_release_ready() then raise exception 'rollback fixture gate failed';end if;
 perform public.commerce_cart_add(repeat('c',64),'98200000-0000-4000-8000-000000000001',1);
 v_rev:=public.checkout_quote(repeat('c',64),v_input->'address')->>'revision';
 v_result:=public.checkout_place_order(repeat('c',64),'98300000-0000-4000-8000-000000000001',v_rev,v_input);v_id:=(v_result->>'id')::uuid;
 if not exists(select 1 from public.orders where id=v_id and status='pending_verification' and verification_status='pending' and review_status='pending' and confirmed_at is null) then raise exception 'actual checkout did not apply review';end if;
 if not exists(select 1 from public.cod_verifications where order_id=v_id and status='pending') or not exists(select 1 from public.order_status_history where order_id=v_id and to_status='pending_verification') then raise exception 'initial snapshots inconsistent';end if;
 if (select payload->>'text' from app_private.order_email_outbox where order_id=v_id) not like '%It is awaiting verification.%' then raise exception 'email copy inconsistent';end if;
 if (select count(*) from public.notifications where entity_id=v_id and event_key='order.review_required')<>1 then raise exception 'review notification absent';end if;
 begin insert into public.shipments(order_id) values(v_id);raise exception 'shipment bypass';exception when others then if sqlerrm<>'manual_review_required' then raise;end if;end;
 update app_private.cod_review_policy set max_orders_hour=1;
 -- Safe replay precedes quota and closed-gate checks.
 update public.system_settings set value='false'::jsonb where key='checkout.orders_enabled';
 if (public.checkout_place_order(repeat('c',64),'98300000-0000-4000-8000-000000000001',v_rev,v_input)->>'id')::uuid<>v_id then raise exception 'quota replay mismatch';end if;
 update public.system_settings set value='true'::jsonb where key='checkout.orders_enabled';
 perform public.commerce_cart_add(repeat('c',64),'98200000-0000-4000-8000-000000000001',1);
 v_rev:=public.checkout_quote(repeat('c',64),v_input->'address')->>'revision';
 begin perform public.checkout_place_order(repeat('c',64),'98300000-0000-4000-8000-000000000002',v_rev,jsonb_set(v_input,'{phone}','"03009876544"'));raise exception 'guest rotated-phone bypass';exception when others then if sqlerrm<>'checkout_order_limit' then raise;end if;end;
 if (select count(*) from app_private.order_email_outbox where order_id=v_id)<>1 or (select reserved from public.inventory_balances where variant_id='98200000-0000-4000-8000-000000000001')<>2 then raise exception 'replay altered stock/email';end if;
end $$;
select 'PASS: canonical checkout review override, initial verification/history/email copy, admin alert, shipment denial, replay after quota/gate, guest rotated-phone quota' as result;
rollback;
