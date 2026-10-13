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
security invoker
set search_path = ''
as $$
  with filtered as (
    select i.*
    from public.catalogue_product_index i
    where (p_category is null or p_category = any(i.category_slugs))
      and (p_collection is null or p_collection = any(i.collection_slugs))
      and (
        p_availability is null
        or (p_availability = 'in-stock' and i.in_stock)
        or (p_availability = 'out-of-stock' and not i.in_stock)
      )
      and (p_min_price is null or coalesce(i.max_price_pkr, 0) >= p_min_price)
      and (p_max_price is null or coalesce(i.min_price_pkr, 0) <= p_max_price)
      and (p_material is null or exists (
        select 1 from unnest(i.materials) value where lower(value) = lower(p_material)
      ))
      and (p_color is null or exists (
        select 1 from unnest(i.colors) value where lower(value) = lower(p_color)
      ))
      and (
        p_search is null
        or i.name ilike ('%' || p_search || '%')
        or coalesce(i.short_description, '') ilike ('%' || p_search || '%')
        or coalesce(i.material_summary, '') ilike ('%' || p_search || '%')
        or exists (select 1 from unnest(i.category_slugs) value where value ilike ('%' || p_search || '%'))
        or exists (select 1 from unnest(i.collection_slugs) value where value ilike ('%' || p_search || '%'))
      )
  )
  select
    f.id, f.product_type, f.name, f.slug, f.short_description, f.material_summary,
    f.published_at, f.primary_category_slug, f.category_slugs, f.collection_slugs,
    f.min_price_pkr, f.max_price_pkr, f.in_stock, f.materials, f.colors,
    f.primary_media_path, f.primary_media_alt, count(*) over() as total_count
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
grant execute on function public.catalogue_products(text,text,text,bigint,bigint,text,text,text,text,integer,integer)
  to anon, authenticated, service_role;

create or replace function public.catalogue_facets(
  p_category text default null,
  p_collection text default null
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with scoped as (
    select i.*
    from public.catalogue_product_index i
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
