create table public.roles (
  slug text primary key,
  name text not null,
  description text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.permissions (
  slug text primary key,
  name text not null,
  description text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.role_permissions (
  role_slug text not null references public.roles(slug) on delete cascade,
  permission_slug text not null references public.permissions(slug) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (role_slug, permission_slug)
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  phone text,
  whatsapp_number text,
  avatar_path text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.staff_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  role_slug text not null references public.roles(slug),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index staff_profiles_single_active_super_admin_idx
on public.staff_profiles ((1))
where role_slug = 'super_admin' and is_active;

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  email extensions.citext,
  full_name text,
  phone text,
  whatsapp_number text,
  status public.customer_status not null default 'active',
  marketing_email_opt_in boolean not null default false,
  marketing_whatsapp_opt_in boolean not null default false,
  first_order_at timestamptz,
  last_order_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index customers_email_idx on public.customers (email);
create index customers_phone_idx on public.customers (phone);
create index customers_status_idx on public.customers (status);

create table public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  label text,
  recipient_name text not null,
  phone text not null,
  whatsapp_number text,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  district text,
  province text not null,
  postal_code text,
  country_code char(2) not null default 'PK' check (country_code = 'PK'),
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index customer_addresses_customer_idx on public.customer_addresses(customer_id);
create unique index customer_addresses_one_default_idx on public.customer_addresses(customer_id) where is_default;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index categories_parent_idx on public.categories(parent_id);
create index categories_active_position_idx on public.categories(is_active, position);

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  position integer not null default 0,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  product_type public.product_type not null,
  status public.product_status not null default 'draft',
  name text not null,
  slug text not null unique,
  short_description text,
  description text,
  material_summary text,
  care_instructions text,
  seo_title text,
  seo_description text,
  specifications jsonb not null default '{}'::jsonb check (jsonb_typeof(specifications) = 'object'),
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index products_status_type_idx on public.products(status, product_type);
create index products_name_trgm_idx on public.products using gin (name extensions.gin_trgm_ops);

create table public.product_categories (
  product_id uuid not null references public.products(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  is_primary boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (product_id, category_id)
);
create index product_categories_category_idx on public.product_categories(category_id, product_id);
create unique index product_categories_one_primary_idx on public.product_categories(product_id) where is_primary;

create table public.collection_products (
  collection_id uuid not null references public.collections(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  position integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (collection_id, product_id)
);
create index collection_products_product_idx on public.collection_products(product_id);

create table public.product_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  slug text not null,
  position integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  unique (product_id, slug)
);

create table public.product_option_values (
  id uuid primary key default gen_random_uuid(),
  option_id uuid not null references public.product_options(id) on delete cascade,
  value text not null,
  swatch_hex text check (swatch_hex is null or swatch_hex ~ '^#[0-9A-Fa-f]{6}$'),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  position integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  unique (option_id, value)
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null unique,
  title text not null,
  status public.variant_status not null default 'active',
  price_pkr bigint not null check (price_pkr >= 0),
  compare_at_price_pkr bigint check (compare_at_price_pkr is null or compare_at_price_pkr >= price_pkr),
  cost_pkr bigint check (cost_pkr is null or cost_pkr >= 0),
  barcode text,
  weight_grams integer check (weight_grams is null or weight_grams >= 0),
  dimensions_cm jsonb not null default '{}'::jsonb check (jsonb_typeof(dimensions_cm) = 'object'),
  attributes jsonb not null default '{}'::jsonb check (jsonb_typeof(attributes) = 'object'),
  track_inventory boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index product_variants_product_status_idx on public.product_variants(product_id, status);

create table public.variant_option_values (
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  option_value_id uuid not null references public.product_option_values(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (variant_id, option_value_id)
);
create index variant_option_values_value_idx on public.variant_option_values(option_value_id, variant_id);

create table public.product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  media_type text not null default 'image' check (media_type in ('image','video')),
  storage_path text not null,
  alt_text text,
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  position integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index product_media_product_position_idx on public.product_media(product_id, position);
create index product_media_variant_idx on public.product_media(variant_id) where variant_id is not null;

create table public.inventory_locations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  city text,
  province text,
  country_code char(2) not null default 'PK' check (country_code = 'PK'),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.inventory_balances (
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  location_id uuid not null references public.inventory_locations(id) on delete restrict,
  on_hand integer not null default 0 check (on_hand >= 0),
  reserved integer not null default 0 check (reserved >= 0),
  available integer generated always as (on_hand - reserved) stored,
  low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (variant_id, location_id),
  check (reserved <= on_hand)
);
create index inventory_balances_location_idx on public.inventory_balances(location_id);
create index inventory_balances_low_stock_idx on public.inventory_balances(available) where available <= low_stock_threshold;

create table public.inventory_ledger (
  id bigint generated always as identity primary key,
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  location_id uuid not null references public.inventory_locations(id) on delete restrict,
  event_type public.inventory_event_type not null,
  delta_on_hand integer not null default 0,
  delta_reserved integer not null default 0,
  balance_on_hand integer not null check (balance_on_hand >= 0),
  balance_reserved integer not null check (balance_reserved >= 0),
  reference_type text,
  reference_id uuid,
  note text,
  actor_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  check (balance_reserved <= balance_on_hand),
  check (delta_on_hand <> 0 or delta_reserved <> 0)
);
create index inventory_ledger_variant_created_idx on public.inventory_ledger(variant_id, created_at desc);
create index inventory_ledger_reference_idx on public.inventory_ledger(reference_type, reference_id) where reference_id is not null;

create table public.shipping_zones (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  country_code char(2) not null default 'PK' check (country_code = 'PK'),
  provinces text[] not null default '{}',
  cities text[] not null default '{}',
  is_nationwide boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.shipping_rules (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null references public.shipping_zones(id) on delete cascade,
  name text not null,
  flat_fee_pkr bigint not null default 0 check (flat_fee_pkr >= 0),
  free_shipping_threshold_pkr bigint check (free_shipping_threshold_pkr is null or free_shipping_threshold_pkr >= 0),
  remote_surcharge_pkr bigint not null default 0 check (remote_surcharge_pkr >= 0),
  cod_min_order_pkr bigint not null default 0 check (cod_min_order_pkr >= 0),
  cod_max_order_pkr bigint check (cod_max_order_pkr is null or cod_max_order_pkr >= cod_min_order_pkr),
  estimated_days_min smallint not null default 2 check (estimated_days_min > 0),
  estimated_days_max smallint not null default 7 check (estimated_days_max >= estimated_days_min),
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);
create index shipping_rules_zone_active_idx on public.shipping_rules(zone_id, is_active);

create table public.system_settings (
  key text primary key,
  value jsonb not null,
  is_public boolean not null default false,
  description text,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger profiles_updated_at before update on public.profiles for each row execute function app_private.set_updated_at();
create trigger staff_profiles_updated_at before update on public.staff_profiles for each row execute function app_private.set_updated_at();
create trigger customers_updated_at before update on public.customers for each row execute function app_private.set_updated_at();
create trigger customer_addresses_updated_at before update on public.customer_addresses for each row execute function app_private.set_updated_at();
create trigger categories_updated_at before update on public.categories for each row execute function app_private.set_updated_at();
create trigger collections_updated_at before update on public.collections for each row execute function app_private.set_updated_at();
create trigger products_updated_at before update on public.products for each row execute function app_private.set_updated_at();
create trigger product_variants_updated_at before update on public.product_variants for each row execute function app_private.set_updated_at();
create trigger product_media_updated_at before update on public.product_media for each row execute function app_private.set_updated_at();
create trigger inventory_locations_updated_at before update on public.inventory_locations for each row execute function app_private.set_updated_at();
create trigger inventory_balances_updated_at before update on public.inventory_balances for each row execute function app_private.set_updated_at();
create trigger shipping_zones_updated_at before update on public.shipping_zones for each row execute function app_private.set_updated_at();
create trigger shipping_rules_updated_at before update on public.shipping_rules for each row execute function app_private.set_updated_at();
create trigger system_settings_updated_at before update on public.system_settings for each row execute function app_private.set_updated_at();
