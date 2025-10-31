
import { ApolloServerPlugin } from "@apollo/server";
import { GraphQLContext } from "../auth/auth.util";
import { Logger } from "pino";

interface ExtendedGraphQLContext extends GraphQLContext {
  log: Logger;
}

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
