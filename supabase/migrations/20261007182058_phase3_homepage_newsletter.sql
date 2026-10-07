create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'homepage',
  status text not null default 'subscribed' check (status in ('subscribed', 'unsubscribed')),
  created_at timestamptz not null default now(),
  constraint newsletter_subscribers_email_lowercase check (email = lower(email)),
  constraint newsletter_subscribers_email_length check (char_length(email) between 5 and 320)
);

create unique index newsletter_subscribers_email_unique
  on public.newsletter_subscribers (email);

alter table public.newsletter_subscribers enable row level security;

revoke all on table public.newsletter_subscribers from anon, authenticated;
grant insert on table public.newsletter_subscribers to anon, authenticated;

create policy "storefront_can_subscribe_newsletter"
on public.newsletter_subscribers
for insert
to anon, authenticated
with check (
  source = 'homepage'
  and status = 'subscribed'
  and char_length(email) between 5 and 320
  and email = lower(email)
);
