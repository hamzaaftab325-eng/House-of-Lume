import { describe, expect, it } from "vitest";
import {
  commerceActionSchema,
  commerceError,
  mediaUrl,
  savedIdsFromStorage,
  sameOrigin,
} from "./commerce";
const id = "11111111-1111-4111-8111-111111111301";
describe("Phase 6 commerce boundaries", () => {
  it("matches the request host without weakening cross-site protection", () => {
    expect(sameOrigin("http://127.0.0.1:3000", "127.0.0.1:3000", "http:")).toBe(true);
    expect(
      sameOrigin(
        "https://house-of-lume-liart.vercel.app",
        "house-of-lume-liart.vercel.app",
        "https:",
      ),
    ).toBe(true);
    expect(sameOrigin("https://evil.example", "house-of-lume-liart.vercel.app", "https:")).toBe(
      false,
    );
    expect(sameOrigin(null, "localhost:3000", "http:")).toBe(false);
  });
  it("rejects client prices, owner IDs, invalid quantities and malformed identifiers", () => {
    for (const input of [
      { action: "add", variantId: id, quantity: 1, price: 1 },
      { action: "add", variantId: id, quantity: 1, customerId: id },
      { action: "quantity", variantId: id, quantity: -1 },
      { action: "add", variantId: id, quantity: 0 },
      { action: "add", variantId: "../../admin", quantity: 1 },
      { action: "quantity", variantId: id, quantity: 1.5 },
    ])
      expect(commerceActionSchema.safeParse(input).success).toBe(false);
    expect(
      commerceActionSchema.safeParse({ action: "quantity", variantId: id, quantity: 0 }).success,
    ).toBe(true);
  });
  it("bounds saved objects and legacy imports", () => {
    expect(
      commerceActionSchema.safeParse({ action: "sync", savedIds: Array(51).fill(id) }).success,
    ).toBe(false);
    expect(
      commerceActionSchema.safeParse({
        action: "import",
        importId: id,
        lines: Array(31).fill({ variantId: id, quantity: 1 }),
      }).success,
    ).toBe(false);
  });
  it("discards malformed and duplicate guest wishlist IDs", () => {
    expect(savedIdsFromStorage("broken")).toEqual([]);
    expect(savedIdsFromStorage(JSON.stringify([id, id, "fake", null, 42]))).toEqual([id]);
  });
  it("does not render arbitrary remote media or scripts", () => {
    expect(mediaUrl("https://res.cloudinary.com/diometfe9/image/upload/test.jpg")).toContain(
      "test.jpg",
    );
    for (const path of [
      "javascript:alert(1)",
      "https://evil.example/image.jpg",
      "https://res.cloudinary.com.evil.example/diometfe9/image/upload/x.jpg",
      null,
    ])
      expect(mediaUrl(path)).toBeNull();
  });
  it("provides actionable stock, discount and account recovery", () => {
    expect(commerceError("insufficient_stock")).toContain("fewer items");
    expect(commerceError("discount_not_found")).toContain("discount");
    expect(commerceError("authentication_required")).toContain("sign in");
  });
});
