type LogContext = Record<string, unknown>;

type LogPayload = {
  level: "info" | "warn" | "error";
  event: string;
  context?: LogContext;
};

function write(payload: LogPayload) {
  const line = JSON.stringify({
    ...payload,
    timestamp: new Date().toISOString(),
  });

  if (payload.level === "error") {
    console.error(line);
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    console.log(line);
  }
}

export const logger = {
  info(event: string, context?: LogContext) {
    write({ level: "info", event, context });
  },
  warn(event: string, context?: LogContext) {
    write({ level: "warn", event, context });
  },
  error(event: string, context?: LogContext) {
    write({ level: "error", event, context });
  },
};
