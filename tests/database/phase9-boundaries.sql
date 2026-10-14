begin;
create temporary table p9b_admin(user_id uuid);
insert into p9b_admin select user_id from public.staff_profiles where is_active and role_slug='super_admin';
grant select on p9b_admin to authenticated;
insert into auth.sessions(id,user_id,created_at,not_after) select '95000000-0000-4000-8000-000000000001',user_id,now(),now()+interval '1 hour' from p9b_admin;
insert into public.orders(id,guest_checkout,contact_name,contact_phone,subtotal_pkr,total_pkr,idempotency_key,placed_at)
 select ('95100000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid,true,'Rollback page fixture','+92300'||lpad(i::text,7,'0'),1000,1000,'p9b-page-'||i,now()-i*interval '1 second' from generate_series(1,21) i;
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',(select user_id from p9b_admin),'role','authenticated','session_id','95000000-0000-4000-8000-000000000001')::text,true);
do $$ declare x jsonb;y jsonb;begin
 x:=public.staff_verification_queue('pending');if jsonb_array_length(x->'items')<>20 or x->>'next_cursor' is null then raise exception 'bounded page/cursor missing';end if;
 y:=public.staff_verification_queue('pending',(x->>'next_cursor')::uuid);if jsonb_array_length(y->'items')<>1 or y->>'next_cursor' is not null then raise exception 'cursor skipped/duplicated orders';end if;
 begin perform public.staff_verification_queue('wrong');raise exception 'filter accepted';exception when others then if sqlerrm<>'invalid_queue_filter' then raise;end if;end;
 begin perform public.staff_verification_detail('95900000-0000-4000-8000-000000000001');raise exception 'missing order accepted';exception when others then if sqlerrm<>'order_unavailable' then raise;end if;end;
 begin perform public.staff_verification_action('95100000-0000-4000-8000-000000000001',gen_random_uuid(),'{"action":"confirm","expectedRevision":0,"note":"ok","staff_id":"spoofed"}');raise exception 'tampered input accepted';exception when others then if sqlerrm<>'invalid_verification_input' then raise;end if;end;
end $$;
reset role;
update public.orders set status='shipped' where id='95100000-0000-4000-8000-000000000001';
update public.orders set status='confirmed',cod_settlement_status='collected_by_courier' where id='95100000-0000-4000-8000-000000000002';
set local role authenticated;
do $$ begin
 if (public.staff_verification_detail('95100000-0000-4000-8000-000000000001')->>'can_cancel')::boolean then raise exception 'shipped order can cancel';end if;
 begin perform public.staff_verification_action('95100000-0000-4000-8000-000000000001',gen_random_uuid(),'{"action":"cancel","expectedRevision":0,"note":"cancel after dispatch"}');raise exception 'shipped cancellation accepted';exception when others then if sqlerrm<>'cancellation_unavailable' then raise;end if;end;
 begin perform public.staff_verification_action('95100000-0000-4000-8000-000000000001',gen_random_uuid(),'{"action":"confirm","expectedRevision":0,"note":"confirm after dispatch"}');raise exception 'shipped confirmation accepted';exception when others then if sqlerrm<>'verification_transition_invalid' then raise;end if;end;
 begin perform public.staff_verification_action('95100000-0000-4000-8000-000000000002',gen_random_uuid(),'{"action":"cancel","expectedRevision":0,"note":"cancel after collection"}');raise exception 'collected cancellation accepted';exception when others then if sqlerrm<>'cancellation_unavailable' then raise;end if;end;
end $$;
reset role;
update public.staff_profiles set is_active=false where user_id=(select user_id from p9b_admin);
set local role authenticated;
do $$ begin
 begin perform public.staff_verification_policy();raise exception 'inactive staff policy accepted';exception when others then if sqlerrm<>'staff_access_required' then raise;end if;end;
 begin perform public.staff_verification_queue();raise exception 'revoked role accepted';exception when others then if sqlerrm<>'staff_access_required' then raise;end if;end;
end $$;
reset role;
select 'PASS: bounded keyset pagination, invalid inputs, unavailable order, shipped/collected cancellation denial, fulfillment transition guard, inactive staff denial' as result;
rollback;
