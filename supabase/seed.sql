-- Development-only seed data for local/test environments.
-- Do not apply this file to the production project.

insert into public.products (
  product_type,
  status,
  name,
  slug,
  short_description,
  description,
  material_summary,
  specifications,
  published_at
)
values
  (
    'lamp',
    'active',
    'Lume Arc Floor Lamp',
    'dev-lume-arc-floor-lamp',
    'A warm floor lamp for layered evening light.',
    'Representative development product for validating lighting variants and inventory flows.',
    'Powder-coated metal, linen shade',
    '{"room":"living-room","dimmable":true}'::jsonb,
    timezone('utc', now())
  ),
  (
    'plant',
    'active',
    'Monstera Deliciosa',
    'dev-monstera-deliciosa',
    'A sculptural indoor plant paired with considered pots.',
    'Representative development product for validating plant, pot and size combinations.',
    'Live plant',
    '{"light":"bright-indirect","pet_safe":false}'::jsonb,
    timezone('utc', now())
  )
on conflict (slug) do nothing;

insert into public.product_categories (product_id, category_id, is_primary)
select p.id, c.id, true
from public.products p
join public.categories c
  on c.slug = case
    when p.slug = 'dev-lume-arc-floor-lamp' then 'lighting'
    when p.slug = 'dev-monstera-deliciosa' then 'plants'
  end
where p.slug in ('dev-lume-arc-floor-lamp', 'dev-monstera-deliciosa')
on conflict (product_id, category_id) do nothing;

insert into public.product_options (product_id, name, slug, position)
select p.id, v.name, v.slug, v.position
from public.products p
join (
  values
    ('dev-lume-arc-floor-lamp', 'Finish', 'finish', 10),
    ('dev-lume-arc-floor-lamp', 'Size', 'size', 20),
    ('dev-lume-arc-floor-lamp', 'Light Temperature', 'light-temperature', 30),
    ('dev-monstera-deliciosa', 'Plant Size', 'plant-size', 10),
    ('dev-monstera-deliciosa', 'Pot', 'pot', 20)
) as v(product_slug, name, slug, position)
  on p.slug = v.product_slug
on conflict (product_id, slug) do nothing;

insert into public.product_option_values (option_id, value, swatch_hex, position)
select po.id, v.value, v.swatch_hex, v.position
from public.product_options po
join public.products p on p.id = po.product_id
join (
  values
    ('dev-lume-arc-floor-lamp', 'finish', 'Warm Brass', '#96744D', 10),
    ('dev-lume-arc-floor-lamp', 'finish', 'Ink Black', '#1E1D1A', 20),
    ('dev-lume-arc-floor-lamp', 'size', 'Medium', null, 10),
    ('dev-lume-arc-floor-lamp', 'size', 'Large', null, 20),
    ('dev-lume-arc-floor-lamp', 'light-temperature', '2700K Warm', null, 10),
    ('dev-monstera-deliciosa', 'plant-size', 'Medium', null, 10),
    ('dev-monstera-deliciosa', 'plant-size', 'Large', null, 20),
    ('dev-monstera-deliciosa', 'pot', 'Nursery Pot', null, 10),
    ('dev-monstera-deliciosa', 'pot', 'Ivory Ceramic', '#E6DED0', 20)
) as v(product_slug, option_slug, value, swatch_hex, position)
  on p.slug = v.product_slug and po.slug = v.option_slug
on conflict (option_id, value) do nothing;

insert into public.product_variants (
  product_id,
  sku,
  title,
  price_pkr,
  compare_at_price_pkr,
  weight_grams,
  attributes
)
select p.id, v.sku, v.title, v.price_pkr, v.compare_at_price_pkr, v.weight_grams, v.attributes
from public.products p
join (
  values
    (
      'dev-lume-arc-floor-lamp',
      'DEV-LAMP-ARC-BRASS-M',
      'Warm Brass / Medium / 2700K Warm',
      18900::bigint,
      20900::bigint,
      4200,
      '{"finish":"Warm Brass","size":"Medium","light_temperature":"2700K Warm"}'::jsonb
    ),
    (
      'dev-lume-arc-floor-lamp',
      'DEV-LAMP-ARC-BLACK-L',
      'Ink Black / Large / 2700K Warm',
      21900::bigint,
      null::bigint,
      4900,
      '{"finish":"Ink Black","size":"Large","light_temperature":"2700K Warm"}'::jsonb
    ),
    (
      'dev-monstera-deliciosa',
      'DEV-PLANT-MON-M-NURSERY',
      'Medium / Nursery Pot',
      3200::bigint,
      null::bigint,
      2500,
      '{"plant_size":"Medium","pot":"Nursery Pot"}'::jsonb
    ),
    (
      'dev-monstera-deliciosa',
      'DEV-PLANT-MON-L-IVORY',
      'Large / Ivory Ceramic',
      7900::bigint,
      null::bigint,
      6200,
      '{"plant_size":"Large","pot":"Ivory Ceramic"}'::jsonb
    )
) as v(product_slug, sku, title, price_pkr, compare_at_price_pkr, weight_grams, attributes)
  on p.slug = v.product_slug
on conflict (sku) do nothing;

insert into public.inventory_balances (
  variant_id,
  location_id,
  on_hand,
  reserved,
  low_stock_threshold
)
select pv.id, il.id, v.on_hand, 0, v.low_stock_threshold
from public.product_variants pv
join public.inventory_locations il on il.code = 'MAIN-PK'
join (
  values
    ('DEV-LAMP-ARC-BRASS-M', 12, 3),
    ('DEV-LAMP-ARC-BLACK-L', 8, 3),
    ('DEV-PLANT-MON-M-NURSERY', 20, 5),
    ('DEV-PLANT-MON-L-IVORY', 6, 2)
) as v(sku, on_hand, low_stock_threshold)
  on pv.sku = v.sku
on conflict (variant_id, location_id) do nothing;

insert into public.customers (
  email,
  full_name,
  phone,
  whatsapp_number
)
select
  'development-customer@houseoflume.test',
  'Development Customer',
  '+923000000000',
  '+923000000000'
where not exists (
  select 1
  from public.customers
  where email = 'development-customer@houseoflume.test'
);

insert into public.orders (
  customer_id,
  guest_checkout,
  contact_name,
  contact_email,
  contact_phone,
  contact_whatsapp,
  status,
  verification_status,
  cod_settlement_status,
  subtotal_pkr,
  discount_pkr,
  shipping_pkr,
  tax_pkr,
  total_pkr,
  idempotency_key
)
select
  c.id,
  false,
  c.full_name,
  c.email,
  c.phone,
  c.whatsapp_number,
  'pending_verification',
  'pending',
  'not_due',
  18900,
  0,
  250,
  0,
  19150,
  'development-seed-order-1'
from public.customers c
where c.email = 'development-customer@houseoflume.test'
  and not exists (
    select 1 from public.orders where idempotency_key = 'development-seed-order-1'
  );

insert into public.order_items (
  order_id,
  product_id,
  variant_id,
  sku,
  product_name,
  variant_name,
  variant_snapshot,
  unit_price_pkr,
  quantity,
  line_total_pkr
)
select
  o.id,
  p.id,
  pv.id,
  pv.sku,
  p.name,
  pv.title,
  pv.attributes,
  18900,
  1,
  18900
from public.orders o
join public.product_variants pv on pv.sku = 'DEV-LAMP-ARC-BRASS-M'
join public.products p on p.id = pv.product_id
where o.idempotency_key = 'development-seed-order-1'
  and not exists (
    select 1 from public.order_items oi where oi.order_id = o.id and oi.sku = pv.sku
  );

insert into public.order_addresses (
  order_id,
  address_type,
  recipient_name,
  phone,
  whatsapp_number,
  address_line1,
  city,
  province,
  country_code,
  delivery_instructions
)
select
  o.id,
  'shipping',
  o.contact_name,
  o.contact_phone,
  o.contact_whatsapp,
  'Development address only',
  'Islamabad',
  'Islamabad Capital Territory',
  'PK',
  'Development seed — never use for a real shipment.'
from public.orders o
where o.idempotency_key = 'development-seed-order-1'
on conflict (order_id, address_type) do nothing;
