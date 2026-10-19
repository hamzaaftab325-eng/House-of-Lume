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
    where pv.id = product_variant_stock_status.variant_id
      and pv.product_id = product_variant_stock_status.product_id
      and pv.status = 'active'
      and p.status = 'active'
      and p.published_at is not null
      and p.published_at <= timezone('utc', now())
  )
);
