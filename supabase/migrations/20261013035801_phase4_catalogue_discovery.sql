create or replace function app_private.catalogue_index()
returns table (
  id uuid,
  product_type text,
  name text,
  slug text,
  short_description text,
  material_summary text,
  published_at timestamptz,
  primary_category_slug text,
  category_slugs text[],
  collection_slugs text[],
  collection_position integer,
  min_price_pkr bigint,
  max_price_pkr bigint,
  in_stock boolean,
  materials text[],
  colors text[],
  primary_media_path text,
  primary_media_alt text
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    p.id,
    p.product_type::text,
    p.name,
    p.slug,
    p.short_description,
    p.material_summary,
    p.published_at,
    categories.primary_category_slug,
    coalesce(categories.category_slugs, '{}'::text[]),
    coalesce(collections.collection_slugs, '{}'::text[]),
    collections.collection_position,
    prices.min_price_pkr,
    prices.max_price_pkr,
    coalesce(stock.in_stock, false),
    coalesce(materials.materials, '{}'::text[]),
    coalesce(colors.colors, '{}'::text[]),
    media.storage_path,
    media.alt_text
  from public.products p
  left join lateral (
    select
      min(c.slug) filter (where pc.is_primary) as primary_category_slug,
      array_agg(distinct c.slug order by c.slug) as category_slugs
    from public.product_categories pc
    join public.categories c on c.id = pc.category_id and c.is_active
    where pc.product_id = p.id
  ) categories on true
  left join lateral (
    select
      array_agg(distinct c.slug order by c.slug) as collection_slugs,
      min(cp.position) as collection_position
    from public.collection_products cp
    join public.collections c on c.id = cp.collection_id
      and c.is_active
      and (c.starts_at is null or c.starts_at <= timezone('utc', now()))
      and (c.ends_at is null or c.ends_at > timezone('utc', now()))
    where cp.product_id = p.id
  ) collections on true
  left join lateral (
    select min(pv.price_pkr) as min_price_pkr, max(pv.price_pkr) as max_price_pkr
    from public.product_variants pv
    where pv.product_id = p.id and pv.status = 'active'
  ) prices on true
  left join lateral (
    select bool_or(
      case
        when not pv.track_inventory then true
        else coalesce(inv.available, 0) > 0
      end
    ) as in_stock
    from public.product_variants pv
    left join lateral (
      select sum(ib.available)::bigint as available
      from public.inventory_balances ib
      where ib.variant_id = pv.id
    ) inv on true
    where pv.product_id = p.id and pv.status = 'active'
  ) stock on true
  left join lateral (
    select array_agg(distinct source.value order by source.value) as materials
    from (
      select trim(value) as value
      from regexp_split_to_table(coalesce(p.material_summary, ''), '\s*,\s*') as value
      where trim(value) <> ''
      union
      select pov.value
      from public.product_variants pv
      join public.variant_option_values vov on vov.variant_id = pv.id
      join public.product_option_values pov on pov.id = vov.option_value_id
      join public.product_options po on po.id = pov.option_id
      where pv.product_id = p.id
        and pv.status = 'active'
        and po.slug like '%material%'
    ) source
  ) materials on true
  left join lateral (
    select array_agg(distinct pov.value order by pov.value) as colors
    from public.product_variants pv
    join public.variant_option_values vov on vov.variant_id = pv.id
    join public.product_option_values pov on pov.id = vov.option_value_id
    join public.product_options po on po.id = pov.option_id
    where pv.product_id = p.id
      and pv.status = 'active'
      and (po.slug like '%color%' or po.slug = 'finish')
  ) colors on true
  left join lateral (
    select pm.storage_path, pm.alt_text
    from public.product_media pm
    where pm.product_id = p.id and pm.variant_id is null
    order by pm.is_primary desc, pm.position asc, pm.created_at asc
    limit 1
  ) media on true
  where p.status = 'active'
    and p.published_at is not null
    and p.published_at <= timezone('utc', now());
$$;

revoke all on function app_private.catalogue_index() from public, anon, authenticated;

create or replace function public.catalogue_products(
  p_category text default null,
  p_collection text default null,
  p_availability text default null,
  p_min_price bigint default null,
  p_max_price bigint default null,
  p_material text default null,
  p_color text default null,
  p_search text default null,
  p_sort text default 'featured',
  p_limit integer default 24,
  p_offset integer default 0
)
returns table (
  id uuid,
  product_type text,
  name text,
  slug text,
  short_description text,
  material_summary text,
  published_at timestamptz,
  primary_category_slug text,
  category_slugs text[],
  collection_slugs text[],
  min_price_pkr bigint,
  max_price_pkr bigint,
  in_stock boolean,
  materials text[],
  colors text[],
  primary_media_path text,
  primary_media_alt text,
  total_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with filtered as (
    select i.*
    from app_private.catalogue_index() i
    where (p_category is null or p_category = any(i.category_slugs))
      and (p_collection is null or p_collection = any(i.collection_slugs))
      and (
        p_availability is null
        or (p_availability = 'in-stock' and i.in_stock)
        or (p_availability = 'out-of-stock' and not i.in_stock)
      )
      and (p_min_price is null or coalesce(i.max_price_pkr, 0) >= p_min_price)
      and (p_max_price is null or coalesce(i.min_price_pkr, 0) <= p_max_price)
      and (
        p_material is null
        or exists (select 1 from unnest(i.materials) value where lower(value) = lower(p_material))
      )
      and (
        p_color is null
        or exists (select 1 from unnest(i.colors) value where lower(value) = lower(p_color))
      )
      and (
        p_search is null
        or position(lower(p_search) in lower(i.name)) > 0
        or position(lower(p_search) in lower(coalesce(i.short_description, ''))) > 0
        or position(lower(p_search) in lower(coalesce(i.material_summary, ''))) > 0
        or exists (select 1 from unnest(i.category_slugs) value where position(lower(p_search) in lower(value)) > 0)
        or exists (select 1 from unnest(i.collection_slugs) value where position(lower(p_search) in lower(value)) > 0)
      )
  )
  select
    f.id,
    f.product_type,
    f.name,
    f.slug,
    f.short_description,
    f.material_summary,
    f.published_at,
    f.primary_category_slug,
    f.category_slugs,
    f.collection_slugs,
    f.min_price_pkr,
    f.max_price_pkr,
    f.in_stock,
    f.materials,
    f.colors,
    f.primary_media_path,
    f.primary_media_alt,
    count(*) over() as total_count
  from filtered f
  order by
    case when p_sort = 'featured' and p_collection is not null then f.collection_position end asc nulls last,
    case when p_sort = 'price-asc' then f.min_price_pkr end asc nulls last,
    case when p_sort = 'price-desc' then f.min_price_pkr end desc nulls last,
    case when p_sort = 'name-asc' then lower(f.name) end asc nulls last,
    case when p_sort = 'newest' then f.published_at end desc nulls last,
    case when p_sort = 'featured' and p_collection is null then f.published_at end desc nulls last,
    lower(f.name) asc
  limit least(greatest(coalesce(p_limit, 24), 1), 100)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke all on function public.catalogue_products(text,text,text,bigint,bigint,text,text,text,text,integer,integer) from public;
grant execute on function public.catalogue_products(text,text,text,bigint,bigint,text,text,text,text,integer,integer) to anon, authenticated, service_role;

create or replace function public.catalogue_facets(
  p_category text default null,
  p_collection text default null
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with scoped as (
    select i.*
    from app_private.catalogue_index() i
    where (p_category is null or p_category = any(i.category_slugs))
      and (p_collection is null or p_collection = any(i.collection_slugs))
  ), material_values as (
    select distinct value
    from scoped s cross join lateral unnest(s.materials) value
    where trim(value) <> ''
  ), color_values as (
    select distinct value
    from scoped s cross join lateral unnest(s.colors) value
    where trim(value) <> ''
  )
  select jsonb_build_object(
    'materials', coalesce((select jsonb_agg(value order by value) from material_values), '[]'::jsonb),
    'colors', coalesce((select jsonb_agg(value order by value) from color_values), '[]'::jsonb),
    'minPricePkr', (select min(min_price_pkr) from scoped where min_price_pkr is not null),
    'maxPricePkr', (select max(max_price_pkr) from scoped where max_price_pkr is not null)
  );
$$;

revoke all on function public.catalogue_facets(text,text) from public;
grant execute on function public.catalogue_facets(text,text) to anon, authenticated, service_role;

create index if not exists products_short_description_trgm_idx
  on public.products using gin (short_description extensions.gin_trgm_ops)
  where short_description is not null;

create index if not exists products_material_summary_trgm_idx
  on public.products using gin (material_summary extensions.gin_trgm_ops)
  where material_summary is not null;
