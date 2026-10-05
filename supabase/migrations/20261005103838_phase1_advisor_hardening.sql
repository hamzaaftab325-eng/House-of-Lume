-- Lock down the project-level RLS event-trigger helper from Data API invocation.
revoke all on function public.rls_auto_enable() from public, anon, authenticated;

-- Cover foreign keys reported by the Supabase performance advisor.
create index if not exists abandoned_carts_customer_fk_idx on public.abandoned_carts(customer_id);
create index if not exists activity_logs_actor_user_fk_idx on public.activity_logs(actor_user_id);
create index if not exists cod_settlements_reconciled_by_fk_idx on public.cod_settlements(reconciled_by);
create index if not exists cod_settlements_shipment_fk_idx on public.cod_settlements(shipment_id);
create index if not exists cod_verifications_initiated_by_fk_idx on public.cod_verifications(initiated_by);
create index if not exists cod_verifications_verified_by_fk_idx on public.cod_verifications(verified_by);
create index if not exists delivery_attempts_recorded_by_fk_idx on public.delivery_attempts(recorded_by);
create index if not exists email_events_notification_delivery_fk_idx on public.email_events(notification_delivery_id);
create index if not exists inventory_ledger_actor_user_fk_idx on public.inventory_ledger(actor_user_id);
create index if not exists inventory_ledger_location_fk_idx on public.inventory_ledger(location_id);
create index if not exists order_items_product_fk_idx on public.order_items(product_id);
create index if not exists order_status_history_changed_by_fk_idx on public.order_status_history(changed_by);
create index if not exists orders_discount_fk_idx on public.orders(discount_id);
create index if not exists orders_shipping_rule_fk_idx on public.orders(shipping_rule_id);
create index if not exists return_items_order_item_fk_idx on public.return_items(order_item_id);
create index if not exists returns_customer_fk_idx on public.returns(customer_id);
create index if not exists returns_handled_by_fk_idx on public.returns(handled_by);
create index if not exists reviews_customer_fk_idx on public.reviews(customer_id);
create index if not exists role_permissions_permission_fk_idx on public.role_permissions(permission_slug);
create index if not exists rto_records_shipment_fk_idx on public.rto_records(shipment_id);
create index if not exists staff_profiles_role_fk_idx on public.staff_profiles(role_slug);
create index if not exists support_messages_author_customer_fk_idx on public.support_messages(author_customer_id);
create index if not exists support_messages_author_user_fk_idx on public.support_messages(author_user_id);
create index if not exists support_tickets_assigned_to_fk_idx on public.support_tickets(assigned_to);
create index if not exists support_tickets_order_fk_idx on public.support_tickets(order_id);
create index if not exists system_settings_updated_by_fk_idx on public.system_settings(updated_by);
create index if not exists wishlist_items_variant_fk_idx on public.wishlist_items(variant_id);

-- Super Admin must be able to inspect every table through a normal authenticated session;
-- row visibility remains controlled by RLS.
grant select on all tables in schema public to authenticated;

-- Remove the broad Super Admin policies from tables that also have customer/public policies.
do $$
declare t text;
begin
  foreach t in array array[
    'activity_logs','cart_items','carts','categories','cod_verifications','collection_products','collections',
    'customer_addresses','customers','delivery_attempts','notification_preferences','notifications',
    'order_addresses','order_items','order_status_history','orders','product_categories','product_media',
    'product_option_values','product_options','product_variants','products','profiles','return_items','returns',
    'reviews','rto_records','shipments','shipping_rules','shipping_zones','support_messages','support_tickets',
    'system_settings','variant_option_values','wishlist_items','wishlists'
  ] loop
    execute format('drop policy if exists %I on public.%I', 'super_admin_full_access_' || t, t);
  end loop;
end $$;

-- Public catalogue: one anon policy plus one authenticated policy that includes Super Admin visibility.
drop policy if exists categories_public_read on public.categories;
create policy categories_anon_read on public.categories for select to anon using (is_active);
create policy categories_authenticated_read on public.categories for select to authenticated using (is_active or app_private.is_super_admin());

drop policy if exists collections_public_read on public.collections;
create policy collections_anon_read on public.collections for select to anon using (is_active and (starts_at is null or starts_at <= timezone('utc', now())) and (ends_at is null or ends_at > timezone('utc', now())));
create policy collections_authenticated_read on public.collections for select to authenticated using ((is_active and (starts_at is null or starts_at <= timezone('utc', now())) and (ends_at is null or ends_at > timezone('utc', now()))) or app_private.is_super_admin());

drop policy if exists products_public_read on public.products;
create policy products_anon_read on public.products for select to anon using (status='active' and published_at is not null and published_at <= timezone('utc', now()));
create policy products_authenticated_read on public.products for select to authenticated using ((status='active' and published_at is not null and published_at <= timezone('utc', now())) or app_private.is_super_admin());

drop policy if exists product_categories_public_read on public.product_categories;
create policy product_categories_anon_read on public.product_categories for select to anon using (exists (select 1 from public.products p where p.id=product_id and p.status='active' and p.published_at is not null and p.published_at <= timezone('utc', now())));
create policy product_categories_authenticated_read on public.product_categories for select to authenticated using (app_private.is_super_admin() or exists (select 1 from public.products p where p.id=product_id and p.status='active' and p.published_at is not null and p.published_at <= timezone('utc', now())));

drop policy if exists collection_products_public_read on public.collection_products;
create policy collection_products_anon_read on public.collection_products for select to anon using (exists (select 1 from public.products p where p.id=product_id and p.status='active' and p.published_at is not null and p.published_at <= timezone('utc', now())) and exists (select 1 from public.collections c where c.id=collection_id and c.is_active));
create policy collection_products_authenticated_read on public.collection_products for select to authenticated using (app_private.is_super_admin() or (exists (select 1 from public.products p where p.id=product_id and p.status='active' and p.published_at is not null and p.published_at <= timezone('utc', now())) and exists (select 1 from public.collections c where c.id=collection_id and c.is_active)));

drop policy if exists product_options_public_read on public.product_options;
create policy product_options_anon_read on public.product_options for select to anon using (exists (select 1 from public.products p where p.id=product_id and p.status='active' and p.published_at is not null and p.published_at <= timezone('utc', now())));
create policy product_options_authenticated_read on public.product_options for select to authenticated using (app_private.is_super_admin() or exists (select 1 from public.products p where p.id=product_id and p.status='active' and p.published_at is not null and p.published_at <= timezone('utc', now())));

drop policy if exists product_option_values_public_read on public.product_option_values;
create policy product_option_values_anon_read on public.product_option_values for select to anon using (exists (select 1 from public.product_options po join public.products p on p.id=po.product_id where po.id=option_id and p.status='active' and p.published_at is not null and p.published_at <= timezone('utc', now())));
create policy product_option_values_authenticated_read on public.product_option_values for select to authenticated using (app_private.is_super_admin() or exists (select 1 from public.product_options po join public.products p on p.id=po.product_id where po.id=option_id and p.status='active' and p.published_at is not null and p.published_at <= timezone('utc', now())));

drop policy if exists product_variants_public_read on public.product_variants;
create policy product_variants_anon_read on public.product_variants for select to anon using (status='active' and exists (select 1 from public.products p where p.id=product_id and p.status='active' and p.published_at is not null and p.published_at <= timezone('utc', now())));
create policy product_variants_authenticated_read on public.product_variants for select to authenticated using (app_private.is_super_admin() or (status='active' and exists (select 1 from public.products p where p.id=product_id and p.status='active' and p.published_at is not null and p.published_at <= timezone('utc', now()))));

drop policy if exists variant_option_values_public_read on public.variant_option_values;
create policy variant_option_values_anon_read on public.variant_option_values for select to anon using (exists (select 1 from public.product_variants pv join public.products p on p.id=pv.product_id where pv.id=variant_id and pv.status='active' and p.status='active' and p.published_at is not null and p.published_at <= timezone('utc', now())));
create policy variant_option_values_authenticated_read on public.variant_option_values for select to authenticated using (app_private.is_super_admin() or exists (select 1 from public.product_variants pv join public.products p on p.id=pv.product_id where pv.id=variant_id and pv.status='active' and p.status='active' and p.published_at is not null and p.published_at <= timezone('utc', now())));

drop policy if exists product_media_public_read on public.product_media;
create policy product_media_anon_read on public.product_media for select to anon using (exists (select 1 from public.products p where p.id=product_id and p.status='active' and p.published_at is not null and p.published_at <= timezone('utc', now())));
create policy product_media_authenticated_read on public.product_media for select to authenticated using (app_private.is_super_admin() or exists (select 1 from public.products p where p.id=product_id and p.status='active' and p.published_at is not null and p.published_at <= timezone('utc', now())));

drop policy if exists shipping_zones_public_read on public.shipping_zones;
create policy shipping_zones_anon_read on public.shipping_zones for select to anon using (is_active);
create policy shipping_zones_authenticated_read on public.shipping_zones for select to authenticated using (is_active or app_private.is_super_admin());

drop policy if exists shipping_rules_public_read on public.shipping_rules;
create policy shipping_rules_anon_read on public.shipping_rules for select to anon using (is_active and (starts_at is null or starts_at <= timezone('utc', now())) and (ends_at is null or ends_at > timezone('utc', now())));
create policy shipping_rules_authenticated_read on public.shipping_rules for select to authenticated using ((is_active and (starts_at is null or starts_at <= timezone('utc', now())) and (ends_at is null or ends_at > timezone('utc', now()))) or app_private.is_super_admin());

drop policy if exists system_settings_public_read on public.system_settings;
create policy system_settings_anon_read on public.system_settings for select to anon using (is_public);
create policy system_settings_authenticated_read on public.system_settings for select to authenticated using (is_public or app_private.is_super_admin());

-- Customer/account policies include Super Admin in the same policy, avoiding duplicate permissive policies.
alter policy profiles_own_read on public.profiles using (id=(select auth.uid()) or app_private.is_super_admin());
alter policy profiles_own_update on public.profiles using (id=(select auth.uid()) or app_private.is_super_admin()) with check (id=(select auth.uid()) or app_private.is_super_admin());
alter policy customers_own_read on public.customers using (user_id=(select auth.uid()) or app_private.is_super_admin());
alter policy customers_own_update on public.customers using (user_id=(select auth.uid()) or app_private.is_super_admin()) with check (user_id=(select auth.uid()) or app_private.is_super_admin());
alter policy customer_addresses_own_all on public.customer_addresses using (app_private.is_customer_owner(customer_id) or app_private.is_super_admin()) with check (app_private.is_customer_owner(customer_id) or app_private.is_super_admin());
alter policy carts_own_all on public.carts using ((customer_id is not null and app_private.is_customer_owner(customer_id)) or app_private.is_super_admin()) with check ((customer_id is not null and app_private.is_customer_owner(customer_id) and guest_token_hash is null) or app_private.is_super_admin());
alter policy cart_items_own_all on public.cart_items using (app_private.owns_cart(cart_id) or app_private.is_super_admin()) with check (app_private.owns_cart(cart_id) or app_private.is_super_admin());
alter policy wishlists_own_all on public.wishlists using (app_private.is_customer_owner(customer_id) or app_private.is_super_admin()) with check (app_private.is_customer_owner(customer_id) or app_private.is_super_admin());
alter policy wishlist_items_own_all on public.wishlist_items using (app_private.owns_wishlist(wishlist_id) or app_private.is_super_admin()) with check (app_private.owns_wishlist(wishlist_id) or app_private.is_super_admin());
alter policy orders_own_read on public.orders using (app_private.owns_order(id) or app_private.is_super_admin());
alter policy order_items_own_read on public.order_items using (app_private.owns_order(order_id) or app_private.is_super_admin());
alter policy order_addresses_own_read on public.order_addresses using (app_private.owns_order(order_id) or app_private.is_super_admin());
alter policy order_status_history_own_read on public.order_status_history using (app_private.owns_order(order_id) or app_private.is_super_admin());
alter policy cod_verifications_own_read on public.cod_verifications using (app_private.owns_order(order_id) or app_private.is_super_admin());
alter policy shipments_own_read on public.shipments using (app_private.owns_order(order_id) or app_private.is_super_admin());
alter policy delivery_attempts_own_read on public.delivery_attempts using (app_private.is_super_admin() or exists (select 1 from public.shipments s where s.id=shipment_id and app_private.owns_order(s.order_id)));
alter policy rto_records_own_read on public.rto_records using (app_private.owns_order(order_id) or app_private.is_super_admin());
alter policy returns_own_read on public.returns using (app_private.owns_order(order_id) or app_private.is_super_admin());
alter policy return_items_own_read on public.return_items using (app_private.is_super_admin() or exists (select 1 from public.returns r where r.id=return_id and app_private.owns_order(r.order_id)));
alter policy notifications_own_read on public.notifications using (recipient_user_id=(select auth.uid()) or (recipient_customer_id is not null and app_private.is_customer_owner(recipient_customer_id)) or app_private.is_super_admin());
alter policy notifications_own_mark_read on public.notifications using (app_private.owns_notification(id) or app_private.is_super_admin()) with check (app_private.owns_notification(id) or app_private.is_super_admin());
alter policy notification_preferences_own_all on public.notification_preferences using (app_private.is_customer_owner(customer_id) or app_private.is_super_admin()) with check (app_private.is_customer_owner(customer_id) or app_private.is_super_admin());
alter policy support_tickets_own_read on public.support_tickets using ((customer_id is not null and app_private.is_customer_owner(customer_id)) or app_private.is_super_admin());
alter policy support_tickets_own_insert on public.support_tickets with check ((customer_id is not null and app_private.is_customer_owner(customer_id)) or app_private.is_super_admin());
alter policy support_messages_own_read on public.support_messages using ((app_private.owns_support_ticket(ticket_id) and not is_internal) or app_private.is_super_admin());
alter policy support_messages_own_insert on public.support_messages with check ((app_private.owns_support_ticket(ticket_id) and author_customer_id is not null and app_private.is_customer_owner(author_customer_id) and is_internal=false) or app_private.is_super_admin());
alter policy activity_logs_own_read on public.activity_logs using ((customer_id is not null and app_private.is_customer_owner(customer_id)) or app_private.is_super_admin());

-- Reviews need separate anon/authenticated SELECT semantics.
drop policy if exists reviews_public_read on public.reviews;
create policy reviews_anon_read on public.reviews for select to anon using (status='approved');
create policy reviews_authenticated_read on public.reviews for select to authenticated using (status='approved' or (customer_id is not null and app_private.is_customer_owner(customer_id)) or app_private.is_super_admin());
alter policy reviews_own_insert on public.reviews with check ((customer_id is not null and app_private.is_customer_owner(customer_id)) or app_private.is_super_admin());
alter policy reviews_own_update on public.reviews using ((customer_id is not null and app_private.is_customer_owner(customer_id) and status='pending') or app_private.is_super_admin()) with check ((customer_id is not null and app_private.is_customer_owner(customer_id) and status='pending') or app_private.is_super_admin());
