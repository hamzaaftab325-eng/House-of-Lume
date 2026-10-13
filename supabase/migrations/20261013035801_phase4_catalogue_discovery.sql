-- Phase 4 catalogue search support. Public product visibility remains governed by
-- the existing product/category/collection RLS policies from Phase 1.

create index if not exists products_short_description_trgm_idx
  on public.products using gin (short_description extensions.gin_trgm_ops)
  where short_description is not null;

create index if not exists products_material_summary_trgm_idx
  on public.products using gin (material_summary extensions.gin_trgm_ops)
  where material_summary is not null;
