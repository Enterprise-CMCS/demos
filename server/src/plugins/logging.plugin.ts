import { ApolloServerPlugin } from "@apollo/server";
import { GraphQLContext } from "../auth";
import { Logger } from "pino";
import { CUSTOM_ERROR_CODES, ErrorLogLevel, isCustomInternalErrorCode } from "../errors/errorCodes";
import { GraphQLError } from "graphql/error";

interface ExtendedGraphQLContext extends GraphQLContext {
  log: Logger;
}

function getErrorLogLevel(err: GraphQLError): ErrorLogLevel {
  if (!err.extensions.code) {
    return "warn";
  }

  const errorCode = err.extensions.code;

  if (typeof errorCode === "string" && isCustomInternalErrorCode(errorCode)) {
    return CUSTOM_ERROR_CODES[errorCode].logLevel;
  } else {
    return "warn";
  }
}

export const loggingPlugin: ApolloServerPlugin = {
  async requestDidStart(requestContext) {
    const start = process.hrtime.bigint();

    const operationName = requestContext.request.operationName;
    const ctx = (requestContext.contextValue ?? {}) as ExtendedGraphQLContext;

    ctx.log.debug({ operationName, type: "graphql.request.start" });

    return {
      async didEncounterErrors(rc) {
        for (const err of rc.errors) {
          const level = getErrorLogLevel(err);
          ctx.log[level]({
            name: err.name,
            message: err.message,
            code: err.extensions.code,
            type: "graphql.request.error",
          });
        }
      },
      async willSendResponse(rc) {
        const end = process.hrtime.bigint();
        const durationMs = Number(end - start) / 1_000_000;
        const errorsCount = rc.errors?.length ?? 0;
        ctx.log.debug({ operationName, errorsCount, durationMs, type: "graphql.request.end" });
      },
    };
  },
};
