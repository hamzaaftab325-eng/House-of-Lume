create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  status text not null default 'subscribed' check (status in ('subscribed','unsubscribed')),
  source text not null default 'homepage' check (source in ('homepage')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint newsletter_email_length check (char_length(email) between 3 and 320),
  constraint newsletter_email_lowercase check (email = lower(email))
);

create unique index if not exists newsletter_subscribers_email_lower_idx
  on public.newsletter_subscribers (lower(email));

alter table public.newsletter_subscribers enable row level security;

revoke all on table public.newsletter_subscribers from anon, authenticated;
grant insert on table public.newsletter_subscribers to anon, authenticated;

create policy "newsletter public subscribe"
  on public.newsletter_subscribers
  for insert
  to anon, authenticated
  with check (status = 'subscribed' and source = 'homepage');

comment on table public.newsletter_subscribers is
  'Public newsletter signups. Anonymous and authenticated clients may insert only; subscriber data is not publicly readable.';
