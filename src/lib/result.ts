export type AppError = {
  code: string;
  message: string;
  cause?: unknown;
};

export type Result<T, E = AppError> = { ok: true; value: T } | { ok: false; error: E };

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function fail(code: string, message: string, cause?: unknown): Result<never> {
  return {
    ok: false,
    error: { code, message, ...(cause === undefined ? {} : { cause }) },
  };
}
