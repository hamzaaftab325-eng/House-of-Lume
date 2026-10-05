# House of Lume — Database Contract

**Phase:** 1 — Database, Domain Model & Security Foundation  
**Database:** Supabase PostgreSQL 17  
**Market:** Pakistan  
**Currency:** PKR  
**Launch payment method:** Cash on Delivery only

## Principles

- Money is stored as integer PKR amounts (`bigint`), never floating point.
- All application timestamps are `timestamptz` and written in UTC.
- Customer, order, staff and operational data is protected with Row Level Security.
- The browser never receives a service-role/secret key.
- Published catalogue data is the only anonymous read surface.
- Authenticated customers can access only their own account data.
- One active `super_admin` is allowed at launch.
- Guest checkout is supported without requiring an Auth user.
- Order, shipment, RTO, COD verification and COD settlement states are independent.
- Order lines and order addresses contain purchase-time snapshots so historical orders do not change when catalogue data changes.
- Inventory is variant/SKU based and separates on-hand, reserved and available quantities.
- Important operational changes are designed to be represented in ledger/history/audit tables rather than overwriting history.

## Domain map

### Identity and authorization

- `profiles`
- `staff_profiles`
- `roles`
- `permissions`
- `role_permissions`

`auth.users` is owned by Supabase Auth. A new Auth user automatically receives a `profiles` record and linked `customers` record. Authorization never trusts `raw_user_meta_data` for staff permissions.

### Customers

- `customers`
- `customer_addresses`

A registered customer may link to `auth.users`. Guest customers/orders remain possible without an Auth identity.

### Catalogue

- `categories`
- `collections`
- `products`
- `product_categories`
- `collection_products`
- `product_options`
- `product_option_values`
- `product_variants`
- `variant_option_values`
- `product_media`

The option/value model supports lamp properties such as color, size, material, finish, shade color, light temperature, bulb type and plug type, plus plant/pot combinations such as plant size, pot size, pot color, pot material and nursery-pot options.

### Inventory

- `inventory_locations`
- `inventory_balances`
- `inventory_ledger`

`inventory_balances.available` is generated as `on_hand - reserved`. The database prevents negative quantities and prevents reserved stock from exceeding on-hand stock.

### Shipping

- `shipping_zones`
- `shipping_rules`

The launch baseline has one Pakistan-wide zone. Shipping amounts are configuration data, not hard-coded application constants.

### Shopping

- `carts`
- `cart_items`
- `wishlists`
- `wishlist_items`
- `abandoned_carts`

Guest carts are supported through a hashed guest token. Logged-in cart/wishlist ownership is enforced by RLS.

### Discounts

- `discounts`
- `discount_rules`
- `discount_redemptions`

### Orders and COD

- `orders`
- `order_items`
- `order_addresses`
- `order_status_history`
- `cod_verifications`
- `cod_settlements`

Order creation uses an `idempotency_key` to support duplicate-submission protection in the application transaction layer.

COD verification methods are restricted to `whatsapp` and `admin` for launch.

### Fulfillment and after-sales

- `shipments`
- `delivery_attempts`
- `rto_records`
- `returns`
- `return_items`

### Reviews and support

- `reviews`
- `support_tickets`
- `support_messages`

### Notifications and email tracking

- `notifications`
- `notification_deliveries`
- `notification_preferences`
- `email_events`

Notifications are persisted first-class records. Delivery channels can independently track in-app, email and WhatsApp attempts.

### Operations and auditing

- `activity_logs`
- `audit_logs`
- `system_settings`

## Launch state machines

### Order

`pending_verification → confirmed → processing → packed → ready_to_ship → shipped → out_for_delivery → delivered`

Exception states: `delivery_failed`, `rto_initiated`, `rto_in_transit`, `rto_received`, `cancelled`.

### COD verification

`pending → sent → customer_confirmed → admin_approved`

Exception states: `rejected`, `expired`.

### COD settlement

`not_due → cash_expected → collected_by_courier → pending_reconciliation → reconciled`

Exception states: `short_received`, `disputed`, `written_off`.

### Shipment

`pending → packed → ready_to_ship → shipped → out_for_delivery → delivered`

Exception states include failed delivery, RTO and cancellation.

## Seeded production baseline

- Role: `super_admin`
- 15 Super Admin permissions
- Categories: Lighting, Plants, Planters, Décor, Candles, Mirrors
- Collections: New Arrivals, Warm Lighting, Living Green, House Essentials
- Inventory location: `MAIN-PK`
- Shipping zone: `PK-NATIONWIDE`
- Standard delivery baseline: PKR 250
- Free-shipping baseline: PKR 5,000
- Guest checkout enabled
- COD enabled and the only allowed launch payment method
- COD verification methods: WhatsApp + Admin

Shipping values are configuration defaults and can later be changed through the CRM without schema changes.

## Development seed data

`supabase/seed.sql` contains representative development-only commerce data:

- lamp product with finish, size and light-temperature variants
- plant product with plant-size and pot combinations
- variant-level inventory
- development customer
- development COD order and address snapshot

This seed file is for local/test environments only and must not be applied to the production project.

## Super Admin bootstrap

The database allows exactly one active Super Admin at launch using a partial unique index.

The actual staff row is intentionally **not fabricated**. First create the real Supabase Auth account that should own the store, then attach that `auth.users.id` to `staff_profiles` with `role_slug = 'super_admin'` through a controlled server/admin operation.

Do not infer an admin identity from Git metadata, project names or customer data.

## RLS model

- Every public table has RLS enabled.
- Anonymous users: published/active catalogue, active shipping configuration, approved reviews and explicitly public settings only.
- Authenticated customers: public data plus records belonging to their linked customer identity.
- Super Admin: complete operational visibility and permitted mutations through RLS-aware policies.
- `service_role`: reserved for trusted server/background operations and never exposed to the browser.
- Private authorization helper functions live under `app_private` and are not exposed as public RPC endpoints.

## Advisor policy

A Phase 1 security advisor run must return no actionable security findings before the phase is considered complete.

Performance advisor `unused_index` notices on a new database are informational. Indexes required for foreign keys and known commerce query patterns are retained until real workload statistics exist; deleting useful indexes simply because a zero-traffic database has not used them is prohibited.

## Migrations

The repository migration filenames mirror the migrations applied to the connected Supabase project:

1. `20261005103238_phase1_core_foundation.sql`
2. `20261005103316_phase1_identity_catalog_inventory.sql`
3. `20261005103418_phase1_commerce_operations.sql`
4. `20261005103534_phase1_security_rls.sql`
5. `20261005103600_phase1_production_baseline_seed.sql`
6. `20261005103838_phase1_advisor_hardening.sql`

New database changes must be made through new migrations. Applied migration files are immutable.

## Type generation

The Supabase schema is the source of truth. Regenerate database types after schema changes with:

```bash
npm run db:types
```

The command uses the connected Supabase project ID and requires an authenticated Supabase CLI session. It writes the current `public` schema type definition to `src/lib/supabase/database.types.ts`. No database secret or service-role key is stored in the repository.
