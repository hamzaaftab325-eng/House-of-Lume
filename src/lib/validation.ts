import type { z } from "zod";

import { fail, ok, type Result } from "@/lib/result";

export function parseWithSchema<TSchema extends z.ZodType>(
  schema: TSchema,
  input: unknown,
): Result<z.output<TSchema>> {
  const parsed = schema.safeParse(input);

  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "Input failed validation.", parsed.error.flatten());
  }

  return ok(parsed.data);
}
