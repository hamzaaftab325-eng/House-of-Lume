begin;
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
('a1000000-0000-4000-8000-000000000001','p10-a@example.invalid',now(),'{"role":"super_admin"}'),('a1000000-0000-4000-8000-000000000002','p10-b@example.invalid',now(),'{}');
insert into auth.sessions(id,user_id,created_at,not_after) values
('a1100000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000001',now(),now()+interval '1 hour'),
('a1100000-0000-4000-8000-000000000002','13ea3052-462e-473f-b023-346a163eaf3a',now(),now()+interval '1 hour');
insert into public.notifications(id,recipient_customer_id,event_key,title,body,entity_type,priority,created_at,data)
 select ('a1200000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid,id,'order.placed','Rollback customer notification','Private owned fixture','order',case when i=1 then 'critical'::public.notification_priority else 'normal'::public.notification_priority end,now()-interval '1 minute','{"href":"https://evil.example"}' from public.customers cross join generate_series(1,23) i where user_id='a1000000-0000-4000-8000-000000000001';
insert into public.notifications(id,recipient_customer_id,event_key,title,body,entity_type) select 'a1200000-0000-4000-8000-000000000024',id,'return.updated','Foreign private notice','Do not expose','return' from public.customers where user_id='a1000000-0000-4000-8000-000000000002';
insert into public.notifications(id,recipient_customer_id,event_key,title,body,entity_type) select 'a1200000-0000-4000-8000-000000000025',id,'account.updated','Admin personal account notice','Customer inbox only','account' from public.customers where user_id='13ea3052-462e-473f-b023-346a163eaf3a';
insert into public.notifications(id,recipient_user_id,event_key,title,body,entity_type) values('a1200000-0000-4000-8000-000000000026','13ea3052-462e-473f-b023-346a163eaf3a','order.review_required','Staff operational notice','Staff inbox only','order');
insert into public.notifications(id,recipient_user_id,audience,event_key,title,body,entity_type) values('a1200000-0000-4000-8000-000000000027','a1000000-0000-4000-8000-000000000002','staff','job.failed','Other staff notice','Other recipient','job');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"a1000000-0000-4000-8000-000000000001","role":"authenticated","session_id":"a1100000-0000-4000-8000-000000000001"}',true);
do $$declare x jsonb;y jsonb;t timestamptz;begin
 x:=public.notification_feed('customer');if jsonb_array_length(x->'items')<>20 or (x->>'unread')::int<>23 or x->>'next_cursor' is null then raise exception 'bounded owned page missing';end if;
 y:=public.notification_feed('customer','all','all','all',(x->>'next_cursor')::uuid);if jsonb_array_length(y->'items')<>3 or y->>'next_cursor' is not null then raise exception 'cursor skipped/duplicated tie rows';end if;
 if exists(select 1 from jsonb_array_elements(x->'items') n where n->>'href' is not null) then raise exception 'arbitrary deep link exposed';end if;
 if jsonb_array_length(public.notification_feed('customer','all','all','critical')->'items')<>1 then raise exception 'priority filter mismatch';end if;
 if jsonb_array_length(public.notification_feed('customer','all','returns')->'items')<>0 then raise exception 'category/recipient leak';end if;
 begin perform public.notification_feed('staff');raise exception 'metadata spoof staff accepted';exception when others then if sqlerrm<>'staff_access_required' then raise;end if;end;
 begin perform public.notification_feed('customer','all','all','all','a1200000-0000-4000-8000-000000000024');raise exception 'foreign cursor accepted';exception when others then if sqlerrm<>'notification_cursor_unavailable' then raise;end if;end;
 begin perform public.notification_read('customer','a1200000-0000-4000-8000-000000000024');raise exception 'foreign mark accepted';exception when others then if sqlerrm<>'notification_unavailable' then raise;end if;end;
 perform public.notification_read('customer','a1200000-0000-4000-8000-000000000001');select read_at into t from public.notifications where id='a1200000-0000-4000-8000-000000000001';
 perform public.notification_read('customer','a1200000-0000-4000-8000-000000000001');if (select read_at from public.notifications where id='a1200000-0000-4000-8000-000000000001')<>t then raise exception 'retry changed read timestamp';end if;
 if public.notification_unread('customer')<>22 then raise exception 'read count mismatch';end if;
 begin update public.notifications set read_at=null;raise exception 'direct timestamp reset accepted';exception when insufficient_privilege then null;end;
 begin perform public.notification_read('customer',null,now()+interval '1 day');raise exception 'future cutoff accepted';exception when others then if sqlerrm<>'invalid_notification_input' then raise;end if;end;
end $$;
reset role;
-- A newer notice must survive mark-all based on the earlier page boundary.
insert into public.notifications(id,recipient_customer_id,event_key,title,body,created_at) select 'a1200000-0000-4000-8000-000000000028',id,'account.updated','New arrival','Keep unread',now()+interval '1 second' from public.customers where user_id='a1000000-0000-4000-8000-000000000001';
set local role authenticated;
select public.notification_read('customer',null,statement_timestamp());
do $$begin if public.notification_unread('customer')<>1 then raise exception 'mark-all swallowed new arrival';end if;end $$;
select set_config('request.jwt.claims','{"sub":"13ea3052-462e-473f-b023-346a163eaf3a","role":"authenticated","session_id":"a1100000-0000-4000-8000-000000000002"}',true);
do $$begin
 if public.notification_unread('staff')<>1 or public.notification_unread('customer')<>1 then raise exception 'admin customer/staff separation failed';end if;
 if (select count(*) from public.notifications)<>2 then raise exception 'admin global inbox access';end if;
 perform public.notification_read('staff',null,statement_timestamp());if public.notification_unread('customer')<>1 then raise exception 'staff mark-all read personal inbox';end if;
 begin perform public.notification_read('customer','a1200000-0000-4000-8000-000000000024');raise exception 'admin read foreign customer inbox';exception when others then if sqlerrm<>'notification_unavailable' then raise;end if;end;
end $$;
reset role;
update app_private.store_owner set access_valid_after=now()+interval '1 second';
set local role authenticated;
do $$begin begin perform public.notification_feed('staff');raise exception 'inactive staff accepted';exception when others then if sqlerrm<>'staff_access_required' then raise;end if;end;end $$;
reset role;
update auth.sessions set not_after=now()-interval '1 second' where id='a1100000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"a1000000-0000-4000-8000-000000000001","role":"authenticated","session_id":"a1100000-0000-4000-8000-000000000001"}',true);
do $$begin begin perform public.notification_feed('customer');raise exception 'expired session accepted';exception when others then if sqlerrm<>'authentication_required' then raise;end if;end;end $$;
reset role;
select 'PASS: owned audiences, staff/customer separation, RLS, spoof/expired/inactive denial, tied keyset pages, filters, safe links, idempotent read timestamps, foreign read/cursor denial and cutoff-safe mark-all' as result;
rollback;
