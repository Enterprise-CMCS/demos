import pino from "pino";
import { AsyncLocalStorage } from "node:async_hooks";

export const setupLogger = (serviceName: string) =>
  pino({
    level: process.env.LOG_LEVEL ?? "info",
    // match lambda application logs, which use "timestamp" rather than "time"
    timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
    base: {
      svc: serviceName,
    },
    formatters: {
      level(label) {
        return { level: label.toUpperCase() };
      },
      log: (obj) => {
        // Extract top-level fields (eg. type to match default AWS lambda logs)
        // All other fields go under `ctx`
        const { type, ...rest } = obj;
        // check `rest` length to prevent logging ctx:{}
        return { type, ctx: Object.keys(rest).length && rest || undefined };
      },
    },
    transport: process.stdout.isTTY
      ? {
          target: "pino-pretty",
        }
      : undefined,
  });

export const parentLogger = setupLogger("dbRoleManagement");

export const reqIdChild = (id: string, extra?: object) => {
  const child = parentLogger.child({requestId: id, ...extra });
  als.getStore()?.set("logger", child);
  return child;
};

export const store = new Map();
export const als = new AsyncLocalStorage<typeof store>();

export const log = new Proxy(parentLogger, {
  get(target, property, receiver) {
    target = als.getStore()?.get("logger") ?? target;
    return Reflect.get(target, property, receiver);
  },
});
