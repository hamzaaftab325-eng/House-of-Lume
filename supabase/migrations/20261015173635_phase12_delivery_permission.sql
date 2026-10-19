-- Delivery diagnostics are separate from access to a recipient-scoped staff inbox.
create or replace function app_private.notification_operations(p_status text default 'all') returns jsonb language plpgsql security definer set search_path='' as $$declare v_types jsonb;v_jobs jsonb;v_health jsonb;v_counts jsonb;begin
 perform app_private.staff_require_permission('notifications.manage');if p_status is null or p_status not in ('all','pending','sending','sent','failed') then raise exception 'invalid_notification_input';end if;
 select jsonb_agg(jsonb_build_object('key',event_key,'audience',audience,'category',category,'required',required,'state',state,'dependency',dependency) order by audience,event_key) into v_types from app_private.notification_types;
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'order_id',order_id,'event',event_key,'version',template_version,'status',status,'attempts',attempt_count,'error',last_error_code,'next_attempt',next_attempt_at,'created_at',created_at) order by created_at desc,id desc),'[]') into v_jobs from(select * from app_private.order_email_outbox where p_status='all' or status=p_status order by created_at desc,id desc limit 20) x;
 select jsonb_build_object('verified_at',verified_at,'last_run_at',last_run_at,'error',last_error_code) into v_health from app_private.order_email_worker_state where singleton;
 select jsonb_build_object('pending',count(*) filter(where status='pending'),'sending',count(*) filter(where status='sending'),'failed',count(*) filter(where status='failed'),'sent',count(*) filter(where status='sent')) into v_counts from app_private.order_email_outbox;
 return jsonb_build_object('types',v_types,'jobs',v_jobs,'health',v_health,'counts',v_counts);
end;$$;
