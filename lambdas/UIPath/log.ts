import pino from "pino";
import { AsyncLocalStorage } from "node:async_hooks";

export const setupLogger = (serviceName: string) =>
  pino({
    level: process.env.LOG_LEVEL ?? "info",
    timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
    base: {
      svc: serviceName,
    },
    formatters: {
      level(label) {
        return { level: label.toUpperCase() };
      },
      log(obj) {
        const { type, ...rest } = obj;
        return { type, ctx: Object.keys(rest).length ? rest : undefined };
      },
    },
    transport: process.stdout.isTTY
      ? {
          target: "pino-pretty",
        }
      : undefined,
  });

export const parentLogger = setupLogger("uipath");

export const store = new Map<string, unknown>();
export const als = new AsyncLocalStorage<typeof store>();

export const reqIdChild = (id: string, extra?: object) => {
  const child = parentLogger.child({ requestId: id, ...extra });
  als.getStore()?.set("logger", child);
  return child;
};

export const log = new Proxy(parentLogger, {
  get(target, property, receiver) {
    const current = als.getStore()?.get("logger") ?? target;
    return Reflect.get(current as object, property, receiver);
  },
});
