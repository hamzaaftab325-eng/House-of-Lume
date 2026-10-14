import { expect, it } from "vitest";
import { productMediaUrl } from "./product-media";
it("allows reviewed local catalogue assets and existing trusted CDN media", () => {
  expect(productMediaUrl("/products/aurelia-table-lamp.webp")).toBe(
    "/products/aurelia-table-lamp.webp",
  );
  expect(productMediaUrl("https://res.cloudinary.com/diometfe9/image/upload/x.png")).toContain(
    "cloudinary",
  );
});
it.each([
  "//evil.example/image.webp",
  "/products/../secret.webp",
  "javascript:alert(1)",
  "https://evil.example/x.png",
  "/products/image.webp?redirect=evil",
])("rejects untrusted media %s", (path) => expect(productMediaUrl(path)).toBeNull());
