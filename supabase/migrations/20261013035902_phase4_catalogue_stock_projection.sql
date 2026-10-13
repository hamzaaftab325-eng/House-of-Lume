create table if not exists public.catalogue_stock_status (
  product_id uuid primary key references public.products(id) on delete cascade,
  in_stock boolean not null default false,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.catalogue_stock_status enable row level security;
revoke all on public.catalogue_stock_status from anon, authenticated;
grant select on public.catalogue_stock_status to anon, authenticated;
grant all on public.catalogue_stock_status to service_role;

create policy catalogue_stock_status_public_read
on public.catalogue_stock_status
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products p
    where p.id = product_id
      and p.status = 'active'
      and p.published_at is not null
      and p.published_at <= timezone('utc', now())
  )
);

create or replace function app_private.refresh_catalogue_stock(p_product_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_in_stock boolean;
begin
  if p_product_id is null then return; end if;

  select coalesce(bool_or(
    case
      when not pv.track_inventory then true
      else coalesce(inv.available, 0) > 0
    end
  ), false)
  into v_in_stock
  from public.product_variants pv
  left join lateral (
    select sum(ib.available)::bigint as available
    from public.inventory_balances ib
    where ib.variant_id = pv.id
  ) inv on true
  where pv.product_id = p_product_id
    and pv.status = 'active';

  insert into public.catalogue_stock_status (product_id, in_stock, updated_at)
  values (p_product_id, v_in_stock, timezone('utc', now()))
  on conflict (product_id) do update
  set in_stock = excluded.in_stock,
      updated_at = excluded.updated_at;
end;
$$;

revoke all on function app_private.refresh_catalogue_stock(uuid) from public, anon, authenticated;

create or replace function app_private.catalogue_stock_from_inventory_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_variant_id uuid;
  v_product_id uuid;
begin
  v_variant_id := case when tg_op = 'DELETE' then old.variant_id else new.variant_id end;
  select pv.product_id into v_product_id
  from public.product_variants pv
  where pv.id = v_variant_id;
  perform app_private.refresh_catalogue_stock(v_product_id);
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function app_private.catalogue_stock_from_inventory_trigger() from public, anon, authenticated;

create or replace function app_private.catalogue_stock_from_variant_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    perform app_private.refresh_catalogue_stock(old.product_id);
    return old;
  end if;

  perform app_private.refresh_catalogue_stock(new.product_id);
  if tg_op = 'UPDATE' and old.product_id is distinct from new.product_id then
    perform app_private.refresh_catalogue_stock(old.product_id);
  end if;
  return new;
end;
$$;

revoke all on function app_private.catalogue_stock_from_variant_trigger() from public, anon, authenticated;

drop trigger if exists catalogue_stock_inventory_changed on public.inventory_balances;
create trigger catalogue_stock_inventory_changed
after insert or update or delete on public.inventory_balances
for each row execute function app_private.catalogue_stock_from_inventory_trigger();

drop trigger if exists catalogue_stock_variant_changed on public.product_variants;
create trigger catalogue_stock_variant_changed
after insert or update of status, track_inventory, product_id or delete on public.product_variants
for each row execute function app_private.catalogue_stock_from_variant_trigger();

select app_private.refresh_catalogue_stock(p.id) from public.products p;

create or replace view public.catalogue_product_index
with (security_invoker = true)
as
select
  p.id,
  p.product_type::text as product_type,
  p.name,
  p.slug,
  p.short_description,
  p.material_summary,
  p.published_at,
  categories.primary_category_slug,
  coalesce(categories.category_slugs, '{}'::text[]) as category_slugs,
  coalesce(collections.collection_slugs, '{}'::text[]) as collection_slugs,
  collections.collection_position,
  prices.min_price_pkr,
  prices.max_price_pkr,
  coalesce(stock.in_stock, false) as in_stock,
  coalesce(materials.materials, '{}'::text[]) as materials,
  coalesce(colors.colors, '{}'::text[]) as colors,
  media.storage_path as primary_media_path,
  media.alt_text as primary_media_alt
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
left join public.catalogue_stock_status stock on stock.product_id = p.id
left join lateral (
  select array_agg(distinct source.value order by source.value) as materials
  from (
    select trim(value) as value
    from regexp_split_to_table(coalesce(p.material_summary, ''), '\\s*,\\s*') as value
    where trim(value) <> ''
    union
    select pov.value
    from public.product_variants pv
    join public.variant_option_values vov on vov.variant_id = pv.id
    join public.product_option_values pov on pov.id = vov.option_value_id
    join public.product_options po on po.id = pov.option_id
    where pv.product_id = p.id and pv.status = 'active' and po.slug like '%material%'
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

revoke all on public.catalogue_product_index from anon, authenticated;
grant select on public.catalogue_product_index to anon, authenticated, service_role;
