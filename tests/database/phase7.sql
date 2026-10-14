begin;
-- Append to the draft migration inside BEGIN/ROLLBACK. These checks create no customer/business data.
do $$
declare v_count integer;
begin
  select count(*) into v_count from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'account_%';
  if v_count <> 6 then raise exception 'expected six public account contracts'; end if;
  if exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'account_%' and p.prosecdef) then raise exception 'public account contract bypasses RLS'; end if;
  if exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'account_%' and has_function_privilege('anon',p.oid,'EXECUTE')) then raise exception 'anonymous account execution'; end if;
  if exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'account_%' and not has_function_privilege('authenticated',p.oid,'EXECUTE')) then raise exception 'authenticated contracts inaccessible'; end if;
  if has_column_privilege('authenticated','public.orders','internal_note','SELECT') or has_column_privilege('authenticated','public.orders','cod_settlement_status','SELECT') then raise exception 'staff-only order fields exposed'; end if;
  if has_column_privilege('authenticated','public.notifications','data','SELECT') then raise exception 'notification payload exposed'; end if;
  if not has_column_privilege('authenticated','public.orders','order_number','SELECT') or not has_column_privilege('authenticated','public.notifications','title','SELECT') then raise exception 'customer-facing columns unavailable'; end if;
  if has_function_privilege('authenticated','app_private.handle_auth_user_update()','EXECUTE') then raise exception 'email sync trigger directly callable'; end if;
  if not exists(select 1 from pg_indexes where schemaname='public' and indexname='returns_customer_request_idx') then raise exception 'return replay constraint missing'; end if;
  if (select count(*) from pg_policies where schemaname='public' and policyname='account_live_session_guard' and permissive='RESTRICTIVE') <> 15 then raise exception 'revoked-session direct access guards missing'; end if;
end;
$$;
set local role authenticated;
select public.account_session_valid() as ownerless_session_is_invalid;
select set_config('request.jwt.claims','{"role":"authenticated"}',true);
do $$
begin
  if public.account_session_valid() then raise exception 'ownerless session was accepted'; end if;
  begin perform public.account_save_profile('Valid name','',''); raise exception 'ownerless profile write succeeded'; exception when others then if sqlerrm <> 'authentication_required' then raise; end if; end;
  begin perform public.account_save_address('{}'::jsonb); raise exception 'ownerless address write succeeded'; exception when others then if sqlerrm <> 'authentication_required' then raise; end if; end;
  begin perform public.account_delete_address(null); raise exception 'ownerless address delete succeeded'; exception when others then if sqlerrm <> 'authentication_required' then raise; end if; end;
  begin perform public.account_save_preferences(false); raise exception 'ownerless preference write succeeded'; exception when others then if sqlerrm <> 'authentication_required' then raise; end if; end;
  begin perform public.account_request_return(null,'','', '[]'::jsonb,null); raise exception 'ownerless return write succeeded'; exception when others then if sqlerrm <> 'authentication_required' then raise; end if; end;
end;
$$;
reset role;
select 'Phase 7: privilege boundaries and five ownerless mutation denials passed; authenticated populated-data acceptance remains pending.' as result;

rollback;
