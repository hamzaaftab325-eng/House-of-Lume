create or replace function app_private.is_super_admin() returns boolean language sql stable security definer set search_path='' as $$
 select app_private.account_session_valid() and exists(select 1 from public.staff_profiles where user_id=auth.uid() and role_slug='super_admin' and is_active);
$$;
revoke all on function app_private.is_super_admin() from public,anon;
grant execute on function app_private.is_super_admin() to authenticated;
