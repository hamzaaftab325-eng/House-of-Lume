# Owner-requested sample catalogue and administrator setup

Four illustrative catalogue concepts were created on 2026-10-14. Each has one SKU, an existing category and collection, a sample PKR price, explicit sample descriptions and zero sellable inventory. They are not currently for sale; the database order guard rejects sample products.

| Product | Sample price | Image asset |
| --- | ---: | --- |
| Aurelia Table Lamp | PKR 8,900 | `public/products/aurelia-table-lamp.webp` |
| Solenne Floor Lamp | PKR 18,900 | `public/products/solenne-floor-lamp.webp` |
| Sable Ceramic Planter | PKR 3,900 | `public/products/sable-ceramic-planter.webp` |
| Terra Stoneware Vase | PKR 4,500 | `public/products/terra-stoneware-vase.webp` |

Images were created with the built-in image-generation tool and optimized to 1200 × 1200 WebP assets. The original generated PNGs were preserved. Their common prompt requested square, photorealistic editorial studio photography on a warm cream plaster backdrop, soft side daylight, realistic grounded shadows, tactile materials, generous margins and no text/logo/watermark. Subjects were: antique bronze table lamp with ivory pleated linen drum shade; slender dark bronze floor lamp with cream conical shade; empty matte sage ceramic planter; empty sand-colored speckled stoneware vase. All images were visually inspected. They are labelled illustrative AI-generated images rather than photographs of verified merchandise.

A new owner-requested dedicated administrator was created through Supabase Auth, using a Gmail alias of the owner’s supplied inbox. The single Super Admin role is stored in `staff_profiles`, never in user-editable metadata. Its credentials were delivered only to the owner and are not present in this repository. Password login, live session and staff RLS access were verified. The `/crm` landing page now checks authentication, live session and active staff role on the server; it provides account/password, notifications and sign-out links. Full operations CRM remains a later phase.

No paid email plan is required to start Resend’s free tier, but real recipients still require an owned verified sending domain. The owner currently has no domain; production order placement remains disabled. The saved Gmail SMTP configuration is for Supabase Auth and does not automatically connect the order-email dispatcher. A Gmail SMTP order-mail adapter would require a Gmail app password securely configured for that application integration, and separate delivery acceptance.

Verification for this update: 92 unit/route/service/component tests, zero-warning lint and TypeScript passed. The complete local Chromium regression suite passed all 59 scenarios, including anonymous administrator-route protection. Database checks accepted the live administrator and denied the same session after temporary revocation; the revocation test rolled back. The production update preserves the closed order gate.

Authenticated HTTP verification also confirmed the administrator workspace and account API return 200 with private/no-store responses. Anonymous access navigates to sign-in.
All four sample product pages and local WebP images returned 200 in the production-build HTTP check.
