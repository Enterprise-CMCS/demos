import pino from "pino";
import { AsyncLocalStorage } from "async_hooks";

export const als = new AsyncLocalStorage();
export const store = new Map();

export const log = pino({
  level: process.env.LOG_LEVEL || "info",
  hooks: {
    logMethod(inputArgs, method) {
      const reqId = als.getStore()?.get("reqId");
      if (reqId) {
        if (typeof inputArgs[0] === "string") {
          inputArgs.unshift({ reqId });
        } else {
          inputArgs[0] = { ...(inputArgs[0] || {}), reqId };
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
