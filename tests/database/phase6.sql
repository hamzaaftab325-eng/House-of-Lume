begin;
-- Run inside BEGIN / ROLLBACK. No QA products, users, carts or discounts persist.
create temporary table phase6_checks(name text primary key);
grant all on phase6_checks to anon, authenticated;
insert into public.products(id,product_type,status,name,slug,published_at) values('66000000-0000-4000-8000-000000000001','lamp','active','Phase 6 transactional fixture','phase6-transactional-fixture',now());
insert into public.product_variants(id,product_id,sku,title,price_pkr,track_inventory) values
('66000000-0000-4000-8000-000000000011','66000000-0000-4000-8000-000000000001','P6-TRANSACTIONAL-A','Reserved fixture',1000,true),
('66000000-0000-4000-8000-000000000012','66000000-0000-4000-8000-000000000001','P6-TRANSACTIONAL-B','Untracked fixture',2000,false);
insert into public.inventory_locations(id,code,name) values('66000000-0000-4000-8000-000000000021','P6-TRANSACTIONAL','Transactional QA');
insert into public.inventory_balances(variant_id,location_id,on_hand) values('66000000-0000-4000-8000-000000000011','66000000-0000-4000-8000-000000000021',5);
insert into public.discounts(code,name,discount_type,percentage_bps) values('P6-TRANSACTIONAL','Transactional discount','percentage',1000);
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values('66000000-0000-4000-8000-000000000031','p6-rollback-a@example.invalid',now(),'{}'),('66000000-0000-4000-8000-000000000032','p6-rollback-b@example.invalid',now(),'{}');
insert into auth.sessions(id,user_id,created_at) values('66000000-0000-4000-8000-000000000051','66000000-0000-4000-8000-000000000031',now()),('66000000-0000-4000-8000-000000000052','66000000-0000-4000-8000-000000000032',now());
set local role anon;
select set_config('request.jwt.claims','{}',true);
do $$ declare q jsonb; begin
 q:=public.commerce_cart_add(repeat('a',64),'66000000-0000-4000-8000-000000000011',2);
 if (q->>'item_count')::integer<>2 or (q->'quote'->>'subtotal_pkr')::integer<>2000 or (q->'lines'->0->>'reserved_quantity')::integer<>2 then raise exception 'guest add/reservation failed'; end if;
 insert into phase6_checks values('guest add, canonical pricing and reservation');
 q:=public.commerce_cart_snapshot(repeat('b',64)); if (q->>'item_count')::integer<>0 then raise exception 'guest isolation failed'; end if;
 insert into phase6_checks values('guest cart isolation');
 begin perform public.commerce_cart_add(repeat('b',64),'66000000-0000-4000-8000-000000000011',4); raise exception 'oversell accepted'; exception when sqlstate 'P0001' then if sqlerrm<>'insufficient_stock' then raise; end if; end;
 q:=public.commerce_cart_snapshot(repeat('a',64)); if (q->>'item_count')::integer<>2 then raise exception 'failed add changed prior cart'; end if;
 insert into phase6_checks values('oversell rejection and transaction rollback');
 q:=public.commerce_cart_set_quantity(repeat('a',64),'66000000-0000-4000-8000-000000000011',1); if (q->'lines'->0->>'reserved_quantity')::integer<>1 then raise exception 'decrease failed'; end if;
 q:=public.commerce_cart_set_quantity(repeat('a',64),'66000000-0000-4000-8000-000000000011',0); if (q->>'item_count')::integer<>0 then raise exception 'remove failed'; end if;
 perform public.commerce_cart_set_quantity(repeat('a',64),'66000000-0000-4000-8000-000000000011',2);
 insert into phase6_checks values('quantity decrease, remove, undo and stock release');
 begin perform public.commerce_cart_set_quantity(repeat('a',64),'66000000-0000-4000-8000-000000000011',null); raise exception 'null quantity accepted'; exception when sqlstate '22023' then null; end;
 begin perform public.commerce_cart_add('bad','66000000-0000-4000-8000-000000000011',1); raise exception 'invalid token accepted'; exception when sqlstate '22023' then null; end;
 insert into phase6_checks values('invalid quantity and guest token rejection');
 perform public.commerce_cart_import(repeat('a',64),'66000000-0000-4000-8000-000000000041','[{"variantId":"66000000-0000-4000-8000-000000000012","quantity":1}]');
 q:=public.commerce_cart_import(repeat('a',64),'66000000-0000-4000-8000-000000000041','[{"variantId":"66000000-0000-4000-8000-000000000012","quantity":1}]');
 if (q->>'item_count')::integer<>3 then raise exception 'import duplicated'; end if;
 insert into phase6_checks values('legacy import replay does not duplicate quantities');
 begin perform public.commerce_wishlist_snapshot(); raise exception 'anonymous account wishlist exposed'; exception when insufficient_privilege then null; end;
 begin perform count(*) from public.inventory_balances; raise exception 'anonymous inventory exposed'; exception when insufficient_privilege then null; end;
 insert into phase6_checks values('anonymous account wishlist and inventory denial');
 q:=public.commerce_cart_apply_discount(repeat('a',64),'P6-TRANSACTIONAL'); if (q->'quote'->>'discount_pkr')::integer<>400 then raise exception 'discount failed'; end if;
 begin perform public.commerce_cart_apply_discount(repeat('a',64),'INVALID'); raise exception 'invalid discount accepted'; exception when sqlstate 'P0001' then if sqlerrm<>'discount_not_found' then raise; end if; end;
 q:=public.commerce_cart_snapshot(repeat('a',64)); if q->'quote'->>'discount_code'<>'P6-TRANSACTIONAL' then raise exception 'failed discount damaged valid code'; end if;
 insert into phase6_checks values('valid discount and invalid-code rollback');
end $$;
reset role;
do $$ begin
 if (select reserved from public.inventory_balances where variant_id='66000000-0000-4000-8000-000000000011' and location_id='66000000-0000-4000-8000-000000000021')<>2 then raise exception 'inventory accounting failed'; end if;
 if (select sum(delta_reserved) from public.inventory_ledger where variant_id='66000000-0000-4000-8000-000000000011')<>2 then raise exception 'ledger accounting failed'; end if;
 insert into phase6_checks values('inventory on-hand/reserved/available and ledger consistency');
end $$;
update public.product_variants set price_pkr=1200 where id='66000000-0000-4000-8000-000000000011';
set local role anon;
do $$ declare q jsonb; begin
 q:=public.commerce_cart_snapshot(repeat('a',64)); if (q->'quote'->>'subtotal_pkr')::integer<>4400 then raise exception 'price did not recalculate'; end if;
 insert into phase6_checks values('price recalculation after catalogue update');
end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"66000000-0000-4000-8000-000000000031","role":"authenticated","session_id":"66000000-0000-4000-8000-000000000051"}',true);
do $$ declare q jsonb; begin
 q:=public.commerce_cart_snapshot(repeat('a',64)); if not (q->>'authenticated')::boolean or (q->>'item_count')::integer<>3 then raise exception 'guest claim failed'; end if;
 perform public.commerce_wishlist_set('66000000-0000-4000-8000-000000000012',true);
 q:=public.commerce_wishlist_snapshot(); if jsonb_array_length(q->'lines')<>1 then raise exception 'wishlist save failed'; end if;
 insert into phase6_checks values('sign-in cart claim and authenticated wishlist persistence');
end $$;
select set_config('request.jwt.claims','{"sub":"66000000-0000-4000-8000-000000000032","role":"authenticated","session_id":"66000000-0000-4000-8000-000000000052"}',true);
do $$ declare q jsonb; begin
 q:=public.commerce_cart_snapshot(repeat('a',64)); if (q->>'item_count')::integer<>0 then raise exception 'customer cart IDOR'; end if;
 q:=public.commerce_wishlist_snapshot(); if jsonb_array_length(q->'lines')<>0 then raise exception 'wishlist IDOR'; end if;
 if (select count(*) from public.cart_items)>0 then raise exception 'direct table RLS IDOR'; end if;
 insert into phase6_checks values('cross-customer cart/wishlist and direct-table RLS isolation');
end $$;
reset role;
set local role anon;
select set_config('request.jwt.claims','{}',true);
select public.commerce_cart_add(repeat('c',64),'66000000-0000-4000-8000-000000000012',2);
reset role;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"66000000-0000-4000-8000-000000000031","role":"authenticated","session_id":"66000000-0000-4000-8000-000000000051"}',true);
do $$ declare q jsonb; begin
 q:=public.commerce_cart_snapshot(repeat('c',64)); if (q->>'item_count')::integer<>5 then raise exception 'guest merge failed'; end if;
 q:=public.commerce_cart_snapshot(repeat('c',64)); if (q->>'item_count')::integer<>5 then raise exception 'guest merge replay duplicated'; end if;
 q:=public.commerce_wishlist_move_to_cart(null,'66000000-0000-4000-8000-000000000012'); if (q->>'item_count')::integer<>6 then raise exception 'move cart failed'; end if;
 q:=public.commerce_wishlist_snapshot(); if jsonb_array_length(q->'lines')<>0 then raise exception 'move did not remove saved item'; end if;
 insert into phase6_checks values('merge after sign-in, replay safety and atomic wishlist move');
end $$;
reset role;
update public.inventory_reservations set expires_at=now()-interval '1 minute' where variant_id='66000000-0000-4000-8000-000000000011';
select app_private.release_expired_inventory_reservations();
do $$ begin if (select reserved from public.inventory_balances where variant_id='66000000-0000-4000-8000-000000000011')<>0 then raise exception 'expiry did not release stock'; end if; insert into phase6_checks values('reservation expiry cleanup'); end $$;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"66000000-0000-4000-8000-000000000031","role":"authenticated","session_id":"66000000-0000-4000-8000-000000000051"}',true);
select public.commerce_cart_set_quantity(null,'66000000-0000-4000-8000-000000000011',2);
reset role;
update public.product_variants set status='inactive' where id='66000000-0000-4000-8000-000000000011';
set local role authenticated;
do $$ declare q jsonb; begin
 q:=public.commerce_cart_set_quantity(null,'66000000-0000-4000-8000-000000000011',0);
 if (q->>'item_count')::integer<>4 then raise exception 'retired variant cannot be removed'; end if;
 insert into phase6_checks values('removal of retired variants');
end $$;
reset role;
select name from phase6_checks order by name;

rollback;
