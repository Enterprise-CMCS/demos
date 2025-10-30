import pino from "pino";
import { ApolloServerPlugin } from "@apollo/server";
import { AsyncLocalStorage } from "node:async_hooks";
import { GraphQLContext } from "./auth/auth.util";

interface ExtendedGraphQLContext extends GraphQLContext {
  log: pino.Logger;
}

export const setupLogger = (serviceName: string) =>
  pino({
    level: process.env.LOG_LEVEL ?? "info",
    timestamp: pino.stdTimeFunctions.isoTime,
    base: {
      svc: serviceName,
    },
    formatters: {
      level(label) {
        return { level: label };
      },
      log: (obj) => {
        // Extract top-level fields (eg. type to match default AWS lambda logs)
        // All other fields go under `ctx`
        const {type, ...rest} = obj
        return {type, ctx: rest}
      }
    },
    transport: process.stdout.isTTY
      ? {
          target: "pino-pretty",
        }
      : undefined,
  });

export const reqIdChild = (id: string, extra: object = {}) => {
  return parentLogger.child({ record: { requestId: id }, ...extra });
};

export const parentLogger = setupLogger("graphql");

export const store = new Map();
export const als = new AsyncLocalStorage<typeof store>();

export const log = new Proxy(parentLogger, {
  get(target, property, receiver) {
    target = als.getStore()?.get("logger") ?? target;
    return Reflect.get(target, property, receiver);
  },
});

export const loggingPlugin: ApolloServerPlugin = {
  async requestDidStart(requestContext) {
    const start = process.hrtime.bigint()

    const operationName = requestContext.request.operationName;
    const ctx = (requestContext.contextValue ?? {}) as ExtendedGraphQLContext;

    ctx.log.info({ operationName, type: "graphql.request.start" });

    return {
      async didEncounterErrors(rc) {
        ctx.log.warn({
          errorsCount: rc.errors.length,
          errors: rc.errors.slice(0,3).map(e => ({name: e.name, message: e.message})),
          type: "graphql.request.errors"
        })
      },
      async willSendResponse(rc) {
        const end = process.hrtime.bigint()
        const durationMs = Number(end - start) / 1_000_000
        const errorsCount = rc.errors?.length ?? 0
        ctx.log.info({ operationName, errorsCount, durationMs, type: "graphql.request.end" });
      },
    };
  },
};
