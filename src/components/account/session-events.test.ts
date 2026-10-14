import { afterEach, expect, it, vi } from "vitest";
import { broadcastAccountChange } from "./session-events";
afterEach(() => vi.unstubAllGlobals());
it("does not block successful account navigation when browser messaging or storage is denied", () => {
  vi.stubGlobal(
    "BroadcastChannel",
    class {
      constructor() {
        throw new Error("Browser policy denied messaging");
      }
    },
  );
  vi.stubGlobal("localStorage", {
    setItem() {
      throw new Error("Storage denied");
    },
  });
  expect(() => broadcastAccountChange()).not.toThrow();
});
