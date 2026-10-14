create function app_private.checkout_apply_discount(p_guest_hash text,p_address jsonb,p_code text) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_cart uuid; v_discount uuid;
begin
 perform app_private.commerce_lock();
 if length(coalesce(p_code,''))>80 then raise exception 'discount_not_eligible'; end if;
 if auth.uid() is not null then
  if app_private.commerce_customer_id() is null then raise exception 'authentication_required'; end if;
  v_cart:=app_private.commerce_claim_guest_cart(p_guest_hash);
 else
  if not app_private.commerce_valid_guest_hash(p_guest_hash) then raise exception 'guest_cart_token_required'; end if;
  v_cart:=app_private.commerce_cart_id(p_guest_hash,false);
 end if;
 if v_cart is null then raise exception 'empty_cart'; end if;
 if nullif(trim(p_code),'') is not null then
  select id into v_discount from public.discounts where code=trim(p_code)::extensions.citext;
  if v_discount is null then raise exception 'discount_not_found'; end if;
 end if;
 update public.carts set discount_id=v_discount,updated_at=now() where id=v_cart;
 return app_private.checkout_quote(p_guest_hash,p_address);
end; $$;
revoke all on function app_private.checkout_apply_discount(text,jsonb,text) from public;
grant execute on function app_private.checkout_apply_discount(text,jsonb,text) to anon,authenticated;
create function public.checkout_apply_discount(p_guest_hash text,p_address jsonb,p_code text) returns jsonb language sql security invoker set search_path='' as $$ select app_private.checkout_apply_discount(p_guest_hash,p_address,p_code); $$;
revoke all on function public.checkout_apply_discount(text,jsonb,text) from public;
grant execute on function public.checkout_apply_discount(text,jsonb,text) to anon,authenticated;
