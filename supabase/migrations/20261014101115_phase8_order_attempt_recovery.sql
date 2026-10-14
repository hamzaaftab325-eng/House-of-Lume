create function app_private.checkout_recover_attempt(p_guest_hash text,p_key uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_customer uuid; v_scope text; v_order uuid;
begin
 perform app_private.commerce_lock();
 if p_key is null then raise exception 'invalid_checkout'; end if;
 if auth.uid() is not null then v_customer:=app_private.commerce_customer_id(); if v_customer is null then raise exception 'authentication_required'; end if; v_scope:='customer:'||v_customer;
 else if not app_private.commerce_valid_guest_hash(p_guest_hash) then return null; end if; v_scope:='guest:'||p_guest_hash; end if;
 select id into v_order from public.orders where idempotency_key=encode(extensions.digest(v_scope||':'||p_key::text,'sha256'),'hex');
 if v_order is null then return null; end if;
 return app_private.checkout_confirmation(v_order,p_guest_hash);
end; $$;
revoke all on function app_private.checkout_recover_attempt(text,uuid) from public;
grant execute on function app_private.checkout_recover_attempt(text,uuid) to anon,authenticated;
create function public.checkout_recover_attempt(p_guest_hash text,p_key uuid) returns jsonb language sql security invoker set search_path='' as $$ select app_private.checkout_recover_attempt(p_guest_hash,p_key); $$;
revoke all on function public.checkout_recover_attempt(text,uuid) from public;
grant execute on function public.checkout_recover_attempt(text,uuid) to anon,authenticated;
