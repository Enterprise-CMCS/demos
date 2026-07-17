import pino from "pino";
import { AsyncLocalStorage } from "node:async_hooks";

export type LoggerStore = Map<"logger", pino.Logger>;

export const setupLogger = (serviceName: string, options?: pino.LoggerOptions<never, boolean>, destination?: pino.DestinationStream) =>
  pino(
    {
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
          return { type, ctx: Object.keys(rest).length ? rest : undefined };
        },
        ...options?.formatters
      },
      transport: process.stdout.isTTY
        ? {
            target: "pino-pretty",
          }
        : undefined,
      ...options,
    },
    destination
  );

export const createLambdaLogger = (serviceName: string, options?: pino.LoggerOptions<never, boolean>, destination?: pino.DestinationStream) => {
  const parentLogger = setupLogger(serviceName, options, destination);
  const store: LoggerStore = new Map();
  const als = new AsyncLocalStorage<LoggerStore>();

  const reqIdChild = (id: string, extra?: object) => {
    const child = parentLogger.child({ requestId: id, ...extra });
    als.getStore()?.set("logger", child);
    return child;
  };

  const log = new Proxy(parentLogger, {
    get(target, property, receiver) {
      target = als.getStore()?.get("logger") ?? target;
      return Reflect.get(target, property, receiver);
    },
  });

  return { parentLogger, reqIdChild, store, als, log };
};
