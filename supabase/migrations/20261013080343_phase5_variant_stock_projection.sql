create table if not exists public.product_variant_stock_status (
  variant_id uuid primary key references public.product_variants(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  available_quantity bigint,
  in_stock boolean not null default false,
  low_stock boolean not null default false,
  updated_at timestamptz not null default timezone('utc', now()),
  check (available_quantity is null or available_quantity >= 0)
);

create index if not exists product_variant_stock_status_product_idx
on public.product_variant_stock_status(product_id, in_stock);

alter table public.product_variant_stock_status enable row level security;
revoke all on public.product_variant_stock_status from anon, authenticated;
grant select on public.product_variant_stock_status to anon, authenticated;
grant all on public.product_variant_stock_status to service_role;

drop policy if exists product_variant_stock_status_public_read on public.product_variant_stock_status;
create policy product_variant_stock_status_public_read
on public.product_variant_stock_status
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.product_variants pv
    join public.products p on p.id = pv.product_id
    where pv.id = variant_id
      and pv.product_id = product_id
      and pv.status = 'active'
      and p.status = 'active'
      and p.published_at is not null
      and p.published_at <= timezone('utc', now())
  )
);

create or replace function app_private.refresh_product_variant_stock(p_variant_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product_id uuid;
  v_status public.variant_status;
  v_track_inventory boolean;
  v_available bigint;
  v_threshold bigint;
begin
  select pv.product_id, pv.status, pv.track_inventory
  into v_product_id, v_status, v_track_inventory
  from public.product_variants pv
  where pv.id = p_variant_id;

  if not found then
    delete from public.product_variant_stock_status where variant_id = p_variant_id;
    return;
  end if;

  if v_status <> 'active' then
    insert into public.product_variant_stock_status (
      variant_id, product_id, available_quantity, in_stock, low_stock, updated_at
    ) values (
      p_variant_id, v_product_id, 0, false, false, timezone('utc', now())
    )
    on conflict (variant_id) do update
      set product_id = excluded.product_id,
          available_quantity = excluded.available_quantity,
          in_stock = excluded.in_stock,
          low_stock = excluded.low_stock,
          updated_at = excluded.updated_at;
    return;
  end if;

  if not v_track_inventory then
    insert into public.product_variant_stock_status (
      variant_id, product_id, available_quantity, in_stock, low_stock, updated_at
    ) values (
      p_variant_id, v_product_id, null, true, false, timezone('utc', now())
    )
    on conflict (variant_id) do update
      set product_id = excluded.product_id,
          available_quantity = excluded.available_quantity,
          in_stock = excluded.in_stock,
          low_stock = excluded.low_stock,
          updated_at = excluded.updated_at;
    return;
  end if;

  select
    coalesce(sum(ib.available), 0)::bigint,
    coalesce(sum(ib.low_stock_threshold), 0)::bigint
  into v_available, v_threshold
  from public.inventory_balances ib
  join public.inventory_locations il on il.id = ib.location_id and il.is_active
  where ib.variant_id = p_variant_id;

  insert into public.product_variant_stock_status (
    variant_id, product_id, available_quantity, in_stock, low_stock, updated_at
  ) values (
    p_variant_id,
    v_product_id,
    v_available,
    v_available > 0,
    v_available > 0 and v_available <= v_threshold,
    timezone('utc', now())
  )
  on conflict (variant_id) do update
    set product_id = excluded.product_id,
        available_quantity = excluded.available_quantity,
        in_stock = excluded.in_stock,
        low_stock = excluded.low_stock,
        updated_at = excluded.updated_at;
end;
$$;

revoke all on function app_private.refresh_product_variant_stock(uuid) from public, anon, authenticated;

create or replace function app_private.product_variant_stock_from_inventory_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_variant_id uuid;
begin
  v_variant_id := case when tg_op = 'DELETE' then old.variant_id else new.variant_id end;
  perform app_private.refresh_product_variant_stock(v_variant_id);
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function app_private.product_variant_stock_from_inventory_trigger() from public, anon, authenticated;

drop trigger if exists product_variant_stock_inventory_changed on public.inventory_balances;
create trigger product_variant_stock_inventory_changed
after insert or update or delete on public.inventory_balances
for each row execute function app_private.product_variant_stock_from_inventory_trigger();

create or replace function app_private.product_variant_stock_from_variant_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.product_variant_stock_status where variant_id = old.id;
    return old;
  end if;

  perform app_private.refresh_product_variant_stock(new.id);
  return new;
end;
$$;

revoke all on function app_private.product_variant_stock_from_variant_trigger() from public, anon, authenticated;

drop trigger if exists product_variant_stock_variant_changed on public.product_variants;
create trigger product_variant_stock_variant_changed
after insert or update of status, track_inventory, product_id or delete on public.product_variants
for each row execute function app_private.product_variant_stock_from_variant_trigger();

select app_private.refresh_product_variant_stock(pv.id)
from public.product_variants pv;
