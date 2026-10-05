import { describe, expect, it } from "vitest";

import { fail, ok } from "./result";

describe("Result helpers", () => {
  it("creates a successful result", () => {
    expect(ok("ready")).toEqual({ ok: true, value: "ready" });
  });

  it("creates an application error result", () => {
    expect(fail("FOUNDATION_ERROR", "Foundation failed.")).toEqual({
      ok: false,
      error: {
        code: "FOUNDATION_ERROR",
        message: "Foundation failed.",
      },
    });
  });
});
