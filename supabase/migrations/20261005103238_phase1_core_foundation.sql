create schema if not exists app_private;

create extension if not exists citext with schema extensions;
create extension if not exists pg_trgm with schema extensions;

create type public.product_type as enum ('lamp','plant','planter','decor','candle','mirror','furniture','other');
create type public.product_status as enum ('draft','active','archived');
create type public.variant_status as enum ('active','inactive','archived');
create type public.customer_status as enum ('active','blocked','archived');
create type public.cart_status as enum ('active','converted','abandoned','expired');
create type public.discount_type as enum ('percentage','fixed_amount','free_shipping');
create type public.order_status as enum ('pending_verification','confirmed','processing','packed','ready_to_ship','shipped','out_for_delivery','delivered','delivery_failed','rto_initiated','rto_in_transit','rto_received','cancelled');
create type public.verification_method as enum ('whatsapp','admin');
create type public.verification_status as enum ('pending','sent','customer_confirmed','admin_approved','rejected','expired');
create type public.cod_settlement_status as enum ('not_due','cash_expected','collected_by_courier','pending_reconciliation','reconciled','short_received','disputed','written_off');
create type public.shipment_status as enum ('pending','packed','ready_to_ship','shipped','out_for_delivery','delivered','delivery_failed','rto_initiated','rto_in_transit','rto_received','cancelled');
create type public.delivery_attempt_status as enum ('successful','failed','rescheduled');
create type public.rto_status as enum ('initiated','in_transit','received','restocked','damaged','closed');
create type public.return_status as enum ('requested','under_review','approved','rejected','in_transit','received','completed','cancelled');
create type public.return_resolution as enum ('exchange','store_credit','manual_refund','replacement','no_action');
create type public.review_status as enum ('pending','approved','rejected');
create type public.support_status as enum ('open','pending_customer','pending_staff','resolved','closed');
create type public.notification_channel as enum ('in_app','email','whatsapp');
create type public.notification_delivery_status as enum ('pending','sent','delivered','failed','cancelled');
create type public.notification_priority as enum ('low','normal','high','critical');
create type public.abandoned_cart_status as enum ('detected','notified','recovered','expired','suppressed');
create type public.inventory_event_type as enum ('initial_stock','purchase_receipt','reservation','reservation_release','order_fulfillment','return_restock','damage','manual_adjustment','rto_restock');
create type public.address_type as enum ('shipping','billing');

create or replace function app_private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

revoke all on function app_private.set_updated_at() from public;
