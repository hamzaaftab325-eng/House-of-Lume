insert into public.roles (slug, name, description) values
  ('super_admin', 'Super Admin', 'Full House of Lume operational access. Launch is limited to one active Super Admin.')
on conflict (slug) do update set name = excluded.name, description = excluded.description;

insert into public.permissions (slug, name, description) values
  ('catalog.manage','Manage catalog','Create, edit, publish and archive products, variants, categories and collections'),
  ('inventory.manage','Manage inventory','Manage stock, reservations, locations and inventory ledger entries'),
  ('orders.manage','Manage orders','Manage the complete customer order lifecycle'),
  ('customers.manage','Manage customers','View and maintain customer records and operational history'),
  ('shipping.manage','Manage shipping','Manage Pakistan delivery zones, shipping rules and shipment operations'),
  ('cod.manage','Manage COD','Verify COD orders and reconcile courier cash'),
  ('returns.manage','Manage returns','Manage returns, RTO and after-sales operations'),
  ('notifications.manage','Manage notifications','Manage operational notifications and delivery attempts'),
  ('reviews.manage','Manage reviews','Moderate product reviews'),
  ('discounts.manage','Manage discounts','Create and manage discount rules and redemptions'),
  ('support.manage','Manage support','Manage customer support tickets and internal notes'),
  ('analytics.view','View analytics','View commerce and operational analytics'),
  ('settings.manage','Manage settings','Manage store and operational settings'),
  ('staff.manage','Manage staff','Manage staff access and roles'),
  ('audit.view','View audit log','View security-sensitive administrative audit history')
on conflict (slug) do update set name = excluded.name, description = excluded.description;

insert into public.role_permissions (role_slug, permission_slug)
select 'super_admin', p.slug from public.permissions p
on conflict do nothing;

insert into public.categories (name, slug, description, position) values
  ('Lighting','lighting','Lamps and considered lighting for warm, lived-in rooms.',10),
  ('Plants','plants','Indoor plants selected for calm, natural living spaces.',20),
  ('Planters','planters','Planters and pots in ceramic, terracotta and natural finishes.',30),
  ('Décor','decor','Decorative objects and finishing pieces for the home.',40),
  ('Candles','candles','Candles and warm ambient objects.',50),
  ('Mirrors','mirrors','Mirrors for light, depth and spatial character.',60)
on conflict (slug) do update set name = excluded.name, description = excluded.description, position = excluded.position;

insert into public.collections (name, slug, description, position) values
  ('New Arrivals','new-arrivals','The newest objects added to House of Lume.',10),
  ('Warm Lighting','warm-lighting','Lighting chosen for warm atmosphere and evening rooms.',20),
  ('Living Green','living-green','Plants and planters for bringing natural life indoors.',30),
  ('House Essentials','house-essentials','Considered everyday objects for a warmer home.',40)
on conflict (slug) do update set name = excluded.name, description = excluded.description, position = excluded.position;

insert into public.inventory_locations (code, name, city, province, country_code, is_active)
values ('MAIN-PK','Main Pakistan Warehouse',null,null,'PK',true)
on conflict (code) do update set name = excluded.name, is_active = true;

with zone as (
  insert into public.shipping_zones (code, name, country_code, is_nationwide, is_active)
  values ('PK-NATIONWIDE','Pakistan Nationwide','PK',true,true)
  on conflict (code) do update set name = excluded.name, is_nationwide = true, is_active = true
  returning id
)
insert into public.shipping_rules (
  zone_id, name, flat_fee_pkr, free_shipping_threshold_pkr, remote_surcharge_pkr,
  cod_min_order_pkr, cod_max_order_pkr, estimated_days_min, estimated_days_max, is_active
)
select id, 'Standard Pakistan Delivery', 250, 5000, 0, 0, null, 2, 7, true from zone
where not exists (
  select 1 from public.shipping_rules sr where sr.zone_id = zone.id and sr.name = 'Standard Pakistan Delivery'
);

insert into public.system_settings (key, value, is_public, description) values
  ('store.country', '"PK"'::jsonb, true, 'Launch market country code'),
  ('store.currency', '"PKR"'::jsonb, true, 'Store currency'),
  ('checkout.guest_enabled', 'true'::jsonb, true, 'Guest checkout is enabled'),
  ('payments.cod_enabled', 'true'::jsonb, true, 'Cash on Delivery is the only launch payment method'),
  ('payments.allowed_methods', '["cod"]'::jsonb, true, 'Allowed launch payment methods'),
  ('cod.verification_methods', '["whatsapp","admin"]'::jsonb, false, 'Allowed COD verification methods'),
  ('staff.single_super_admin', 'true'::jsonb, false, 'Launch governance permits one active Super Admin'),
  ('shipping.default_flat_fee_pkr', '250'::jsonb, true, 'Default nationwide shipping fee below the free-shipping threshold'),
  ('shipping.free_threshold_pkr', '5000'::jsonb, true, 'Free shipping threshold for standard Pakistan delivery')
on conflict (key) do update set value = excluded.value, is_public = excluded.is_public, description = excluded.description, updated_at = timezone('utc', now());
