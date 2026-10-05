create or replace function app_private.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.staff_profiles sp
    where sp.user_id = (select auth.uid())
      and sp.role_slug = 'super_admin'
      and sp.is_active
  );
$$;

create or replace function app_private.is_customer_owner(p_customer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.customers c
    where c.id = p_customer_id
      and c.user_id = (select auth.uid())
  );
$$;

create or replace function app_private.owns_cart(p_cart_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.carts c
    join public.customers cu on cu.id = c.customer_id
    where c.id = p_cart_id
      and cu.user_id = (select auth.uid())
  );
$$;

create or replace function app_private.owns_wishlist(p_wishlist_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.wishlists w
    join public.customers c on c.id = w.customer_id
    where w.id = p_wishlist_id
      and c.user_id = (select auth.uid())
  );
$$;

create or replace function app_private.owns_order(p_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.orders o
    join public.customers c on c.id = o.customer_id
    where o.id = p_order_id
      and c.user_id = (select auth.uid())
  );
$$;

create or replace function app_private.owns_notification(p_notification_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.notifications n
    left join public.customers c on c.id = n.recipient_customer_id
    where n.id = p_notification_id
      and (n.recipient_user_id = (select auth.uid()) or c.user_id = (select auth.uid()))
  );
$$;

create or replace function app_private.owns_support_ticket(p_ticket_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.support_tickets t
    join public.customers c on c.id = t.customer_id
    where t.id = p_ticket_id
      and c.user_id = (select auth.uid())
  );
$$;

create or replace function app_private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
  v_whatsapp text;
begin
  v_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')), '');
  v_whatsapp := nullif(trim(coalesce(new.raw_user_meta_data ->> 'whatsapp_number', new.phone, '')), '');

  insert into public.profiles (id, display_name, phone, whatsapp_number)
  values (new.id, v_name, new.phone, v_whatsapp)
  on conflict (id) do nothing;

  insert into public.customers (user_id, email, full_name, phone, whatsapp_number)
  values (new.id, new.email, v_name, new.phone, v_whatsapp)
  on conflict (user_id) do update
    set email = excluded.email,
        full_name = coalesce(public.customers.full_name, excluded.full_name),
        phone = coalesce(public.customers.phone, excluded.phone),
        whatsapp_number = coalesce(public.customers.whatsapp_number, excluded.whatsapp_number),
        updated_at = timezone('utc', now());

  return new;
end;
$$;

create or replace function app_private.handle_auth_user_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.customers
  set email = new.email,
      phone = coalesce(new.phone, phone),
      updated_at = timezone('utc', now())
  where user_id = new.id;

  update public.profiles
  set phone = coalesce(new.phone, phone),
      updated_at = timezone('utc', now())
  where id = new.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function app_private.handle_new_auth_user();

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
after update of email, phone on auth.users
for each row when (old.email is distinct from new.email or old.phone is distinct from new.phone)
execute function app_private.handle_auth_user_update();

revoke all on schema app_private from public;
grant usage on schema app_private to authenticated;

revoke all on function app_private.is_super_admin() from public;
revoke all on function app_private.is_customer_owner(uuid) from public;
revoke all on function app_private.owns_cart(uuid) from public;
revoke all on function app_private.owns_wishlist(uuid) from public;
revoke all on function app_private.owns_order(uuid) from public;
revoke all on function app_private.owns_notification(uuid) from public;
revoke all on function app_private.owns_support_ticket(uuid) from public;
revoke all on function app_private.handle_new_auth_user() from public;
revoke all on function app_private.handle_auth_user_update() from public;

grant execute on function app_private.is_super_admin() to authenticated;
grant execute on function app_private.is_customer_owner(uuid) to authenticated;
grant execute on function app_private.owns_cart(uuid) to authenticated;
grant execute on function app_private.owns_wishlist(uuid) to authenticated;
grant execute on function app_private.owns_order(uuid) to authenticated;
grant execute on function app_private.owns_notification(uuid) to authenticated;
grant execute on function app_private.owns_support_ticket(uuid) to authenticated;

do $$
declare r record;
begin
  for r in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', r.tablename);
  end loop;
end $$;

revoke all on all tables in schema public from anon, authenticated;
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

grant select on public.categories, public.collections, public.products, public.product_categories,
  public.collection_products, public.product_options, public.product_option_values,
  public.product_variants, public.variant_option_values, public.product_media,
  public.shipping_zones, public.shipping_rules, public.system_settings, public.reviews
  to anon, authenticated;

create policy categories_public_read on public.categories for select to anon, authenticated using (is_active);
create policy collections_public_read on public.collections for select to anon, authenticated using (
  is_active and (starts_at is null or starts_at <= timezone('utc', now())) and (ends_at is null or ends_at > timezone('utc', now()))
);
create policy products_public_read on public.products for select to anon, authenticated using (
  status = 'active' and published_at is not null and published_at <= timezone('utc', now())
);
create policy product_categories_public_read on public.product_categories for select to anon, authenticated using (
  exists (select 1 from public.products p where p.id = product_id and p.status = 'active' and p.published_at is not null and p.published_at <= timezone('utc', now()))
);
create policy collection_products_public_read on public.collection_products for select to anon, authenticated using (
  exists (select 1 from public.products p where p.id = product_id and p.status = 'active' and p.published_at is not null and p.published_at <= timezone('utc', now()))
  and exists (select 1 from public.collections c where c.id = collection_id and c.is_active)
);
create policy product_options_public_read on public.product_options for select to anon, authenticated using (
  exists (select 1 from public.products p where p.id = product_id and p.status = 'active' and p.published_at is not null and p.published_at <= timezone('utc', now()))
);
create policy product_option_values_public_read on public.product_option_values for select to anon, authenticated using (
  exists (select 1 from public.product_options po join public.products p on p.id = po.product_id where po.id = option_id and p.status = 'active' and p.published_at is not null and p.published_at <= timezone('utc', now()))
);
create policy product_variants_public_read on public.product_variants for select to anon, authenticated using (
  status = 'active' and exists (select 1 from public.products p where p.id = product_id and p.status = 'active' and p.published_at is not null and p.published_at <= timezone('utc', now()))
);
create policy variant_option_values_public_read on public.variant_option_values for select to anon, authenticated using (
  exists (select 1 from public.product_variants pv join public.products p on p.id = pv.product_id where pv.id = variant_id and pv.status = 'active' and p.status = 'active' and p.published_at is not null and p.published_at <= timezone('utc', now()))
);
create policy product_media_public_read on public.product_media for select to anon, authenticated using (
  exists (select 1 from public.products p where p.id = product_id and p.status = 'active' and p.published_at is not null and p.published_at <= timezone('utc', now()))
);
create policy shipping_zones_public_read on public.shipping_zones for select to anon, authenticated using (is_active);
create policy shipping_rules_public_read on public.shipping_rules for select to anon, authenticated using (
  is_active and (starts_at is null or starts_at <= timezone('utc', now())) and (ends_at is null or ends_at > timezone('utc', now()))
);
create policy system_settings_public_read on public.system_settings for select to anon, authenticated using (is_public);
create policy reviews_public_read on public.reviews for select to anon, authenticated using (status = 'approved');

grant select on public.profiles, public.customers, public.customer_addresses, public.carts, public.cart_items,
  public.wishlists, public.wishlist_items, public.orders, public.order_items, public.order_addresses,
  public.order_status_history, public.cod_verifications, public.shipments, public.delivery_attempts,
  public.rto_records, public.returns, public.return_items, public.notifications, public.notification_preferences,
  public.support_tickets, public.support_messages, public.activity_logs
  to authenticated;
grant update (display_name, phone, whatsapp_number, avatar_path) on public.profiles to authenticated;
grant update (full_name, phone, whatsapp_number, marketing_email_opt_in, marketing_whatsapp_opt_in) on public.customers to authenticated;
grant insert, update, delete on public.customer_addresses to authenticated;
grant insert, update, delete on public.carts, public.cart_items, public.wishlists, public.wishlist_items to authenticated;
grant insert (product_id, customer_id, order_item_id, rating, title, body) on public.reviews to authenticated;
grant update (rating, title, body) on public.reviews to authenticated;
grant insert on public.notification_preferences to authenticated;
grant update (in_app_order_updates, email_order_updates, whatsapp_order_updates, email_marketing, whatsapp_marketing) on public.notification_preferences to authenticated;
grant update (read_at) on public.notifications to authenticated;
grant insert (customer_id, order_id, subject, priority) on public.support_tickets to authenticated;
grant insert (ticket_id, author_user_id, author_customer_id, body, is_internal) on public.support_messages to authenticated;

create policy profiles_own_read on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy profiles_own_update on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy customers_own_read on public.customers for select to authenticated using (user_id = (select auth.uid()));
create policy customers_own_update on public.customers for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy customer_addresses_own_all on public.customer_addresses for all to authenticated using (app_private.is_customer_owner(customer_id)) with check (app_private.is_customer_owner(customer_id));
create policy carts_own_all on public.carts for all to authenticated using (customer_id is not null and app_private.is_customer_owner(customer_id)) with check (customer_id is not null and app_private.is_customer_owner(customer_id) and guest_token_hash is null);
create policy cart_items_own_all on public.cart_items for all to authenticated using (app_private.owns_cart(cart_id)) with check (app_private.owns_cart(cart_id));
create policy wishlists_own_all on public.wishlists for all to authenticated using (app_private.is_customer_owner(customer_id)) with check (app_private.is_customer_owner(customer_id));
create policy wishlist_items_own_all on public.wishlist_items for all to authenticated using (app_private.owns_wishlist(wishlist_id)) with check (app_private.owns_wishlist(wishlist_id));
create policy orders_own_read on public.orders for select to authenticated using (app_private.owns_order(id));
create policy order_items_own_read on public.order_items for select to authenticated using (app_private.owns_order(order_id));
create policy order_addresses_own_read on public.order_addresses for select to authenticated using (app_private.owns_order(order_id));
create policy order_status_history_own_read on public.order_status_history for select to authenticated using (app_private.owns_order(order_id));
create policy cod_verifications_own_read on public.cod_verifications for select to authenticated using (app_private.owns_order(order_id));
create policy shipments_own_read on public.shipments for select to authenticated using (app_private.owns_order(order_id));
create policy delivery_attempts_own_read on public.delivery_attempts for select to authenticated using (
  exists (select 1 from public.shipments s where s.id = shipment_id and app_private.owns_order(s.order_id))
);
create policy rto_records_own_read on public.rto_records for select to authenticated using (app_private.owns_order(order_id));
create policy returns_own_read on public.returns for select to authenticated using (app_private.owns_order(order_id));
create policy return_items_own_read on public.return_items for select to authenticated using (
  exists (select 1 from public.returns r where r.id = return_id and app_private.owns_order(r.order_id))
);
create policy reviews_own_insert on public.reviews for insert to authenticated with check (customer_id is not null and app_private.is_customer_owner(customer_id));
create policy reviews_own_update on public.reviews for update to authenticated using (customer_id is not null and app_private.is_customer_owner(customer_id) and status = 'pending') with check (customer_id is not null and app_private.is_customer_owner(customer_id) and status = 'pending');
create policy notifications_own_read on public.notifications for select to authenticated using (
  recipient_user_id = (select auth.uid()) or (recipient_customer_id is not null and app_private.is_customer_owner(recipient_customer_id))
);
create policy notifications_own_mark_read on public.notifications for update to authenticated using (app_private.owns_notification(id)) with check (app_private.owns_notification(id));
create policy notification_preferences_own_all on public.notification_preferences for all to authenticated using (app_private.is_customer_owner(customer_id)) with check (app_private.is_customer_owner(customer_id));
create policy support_tickets_own_read on public.support_tickets for select to authenticated using (customer_id is not null and app_private.is_customer_owner(customer_id));
create policy support_tickets_own_insert on public.support_tickets for insert to authenticated with check (customer_id is not null and app_private.is_customer_owner(customer_id));
create policy support_messages_own_read on public.support_messages for select to authenticated using (app_private.owns_support_ticket(ticket_id) and not is_internal);
create policy support_messages_own_insert on public.support_messages for insert to authenticated with check (app_private.owns_support_ticket(ticket_id) and author_customer_id is not null and app_private.is_customer_owner(author_customer_id) and is_internal = false);
create policy activity_logs_own_read on public.activity_logs for select to authenticated using (customer_id is not null and app_private.is_customer_owner(customer_id));

do $$
declare r record;
begin
  for r in select tablename from pg_tables where schemaname = 'public' loop
    execute format(
      'create policy %I on public.%I for all to authenticated using (app_private.is_super_admin()) with check (app_private.is_super_admin())',
      'super_admin_full_access_' || r.tablename,
      r.tablename
    );
  end loop;
end $$;

alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant usage, select on sequences to service_role;
