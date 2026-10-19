-- Isolated transaction: no SMTP dispatch, no real customer data, always rolled back.
begin;
create temporary table owner_test_state(user_id uuid);
insert into owner_test_state select user_id from app_private.store_owner;
grant select on owner_test_state to authenticated;
insert into auth.sessions(id,user_id,created_at,not_after)
select 'b2100000-0000-4000-8000-000000000001',user_id,now(),now()+interval '1 hour' from owner_test_state;
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data)
values('b2200000-0000-4000-8000-000000000001','not-owner@example.invalid',now(),'{"role":"super_admin","permissions":["*"]}');
insert into auth.sessions(id,user_id,created_at,not_after)
values('b2100000-0000-4000-8000-000000000002','b2200000-0000-4000-8000-000000000001',now(),now()+interval '1 hour');
do $$ begin
 if (select count(*) from app_private.store_owner)<>1 then raise exception 'owner count';end if;
 begin insert into app_private.store_owner(singleton,user_id) values(false,'b2200000-0000-4000-8000-000000000001');raise exception 'second owner accepted';exception when check_violation then null;end;
 if to_regprocedure('public.staff_access_action(uuid,jsonb)') is not null or to_regprocedure('public.staff_directory(uuid)') is not null or to_regprocedure('public.staff_context()') is not null then raise exception 'staff management still exposed';end if;
 if exists(select 1 from information_schema.tables where table_schema='public' and table_name in ('roles','role_permissions','permissions')) then raise exception 'active RBAC tables remain';end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',(select user_id from owner_test_state),'role','authenticated','session_id','b2100000-0000-4000-8000-000000000001')::text,true);
do $$ begin
 if not app_private.is_super_admin() or public.owner_context()->>'userId'<>(select user_id::text from owner_test_state) then raise exception 'owner denied';end if;
 if (select count(*) from public.staff_profiles)<>1 then raise exception 'rolling deployment bridge broken';end if;
 perform public.staff_verification_queue();perform public.staff_verification_policy();perform public.notification_operations();perform public.notification_feed('staff');
 begin insert into app_private.store_owner(user_id) values('b2200000-0000-4000-8000-000000000001');raise exception 'client owner promotion accepted';exception when insufficient_privilege then null;end;
 begin update public.staff_profiles set is_active=false;raise exception 'legacy view writable';exception when insufficient_privilege or object_not_in_prerequisite_state or feature_not_supported then null;end;
 begin select count(*) from app_private.legacy_staff_profiles;raise exception 'archive exposed';exception when insufficient_privilege then null;end;
end $$;
reset role;
-- An owner does not need an active customer record to operate the shop.
update public.customers set status='blocked' where user_id=(select user_id from owner_test_state);
set local role authenticated;
do $$ begin perform public.owner_context();perform public.staff_verification_queue();end $$;
reset role;
delete from public.customers where user_id=(select user_id from owner_test_state);
set local role authenticated;
do $$ begin perform public.owner_context();perform public.notification_feed('staff');end $$;
select set_config('request.jwt.claims','{"sub":"b2200000-0000-4000-8000-000000000001","role":"authenticated","session_id":"b2100000-0000-4000-8000-000000000002","role_slug":"super_admin"}',true);
do $$ begin
 if app_private.is_super_admin() or exists(select 1 from public.staff_profiles) or exists(select 1 from app_private.store_owner) then raise exception 'non-owner promoted';end if;
 begin perform public.owner_context();raise exception 'non-owner context accepted';exception when others then if sqlerrm<>'staff_access_required' then raise;end if;end;
 begin perform public.staff_verification_queue();raise exception 'non-owner queue accepted';exception when others then if sqlerrm<>'staff_access_required' then raise;end if;end;
 begin perform public.notification_operations();raise exception 'non-owner operations accepted';exception when others then if sqlerrm<>'staff_access_required' then raise;end if;end;
end $$;
reset role;
select set_config('request.jwt.claims',jsonb_build_object('sub',(select user_id from owner_test_state),'role','authenticated','session_id','b2100000-0000-4000-8000-000000000001')::text,true);
update auth.users set banned_until=now()+interval '1 day' where id=(select user_id from owner_test_state);
set local role authenticated;
do $$ begin begin perform public.owner_context();raise exception 'banned owner accepted';exception when others then if sqlerrm<>'staff_access_required' then raise;end if;end;end $$;
reset role;
update auth.users set banned_until=null where id=(select user_id from owner_test_state);
update app_private.store_owner set access_valid_after=now()+interval '1 second';
set local role authenticated;
do $$ begin begin perform public.owner_context();raise exception 'old owner session accepted';exception when others then if sqlerrm<>'staff_access_required' then raise;end if;end;end $$;
reset role;
update app_private.store_owner set access_valid_after='-infinity';
update auth.sessions set not_after=now()-interval '1 second' where id='b2100000-0000-4000-8000-000000000001';
set local role authenticated;
do $$ begin begin perform public.owner_context();raise exception 'expired session accepted';exception when others then if sqlerrm<>'authentication_required' then raise;end if;end;end $$;
reset role;
update auth.sessions set not_after=now()+interval '1 hour' where id='b2100000-0000-4000-8000-000000000001';
delete from auth.sessions where id='b2100000-0000-4000-8000-000000000001';
set local role authenticated;
do $$ begin begin perform public.owner_context();raise exception 'revoked session accepted';exception when others then if sqlerrm<>'authentication_required' then raise;end if;end;end $$;
reset role;
select 'PASS: singleton owner, private archives, read-only rollout bridge, metadata spoof denial, customer-independent owner, ban/session-floor/expiry/revocation, verification/notifications owner access' as result;
rollback;
