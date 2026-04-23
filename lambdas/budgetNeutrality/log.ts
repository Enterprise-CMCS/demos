import pino from "pino";
import { AsyncLocalStorage } from "node:async_hooks";

export const als = new AsyncLocalStorage<Map<string, string>>();
export const store = new Map<string, string>();

export const log = pino({
  level: process.env.LOG_LEVEL || "info",
  hooks: {
    logMethod(inputArgs, method) {
      const reqId = als.getStore()?.get("reqId");
      if (reqId) {
        if (typeof inputArgs[0] === "string") {
          inputArgs.unshift({ reqId });
        } else {
          const firstArg = (inputArgs[0] ?? {}) as Record<string, unknown>;
          inputArgs[0] = { ...firstArg, reqId };
        }
      }
      method.apply(this, inputArgs);
    },
  },
  transport:
    process.env.RUN_LOCAL === "true"
      ? {
          target: "pino-pretty",
          options: {
            translateTime: "yyyy-mm-dd HH:MM:ss",
            ignore: "pid,hostname",
          },
        }
      : undefined,
});

export const reqIdChild = (reqId: string) => {
  if (reqId) {
    als.getStore()?.set("reqId", reqId);
  }
};
