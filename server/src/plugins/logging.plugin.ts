import type {
  ApolloServerPlugin,
  GraphQLRequestListener,
} from '@apollo/server';
import { log, setRequestContext, addToRequestContext } from '../logger.js';

export const loggingPlugin: ApolloServerPlugin<any> = {
  async requestDidStart(requestContext): Promise<GraphQLRequestListener<any>> {
    const start = process.hrtime.bigint();

    // Try to pull identifiers from context or HTTP headers
    const ctx: any = requestContext.contextValue || {};
    const lambdaEvent = ctx.lambdaEvent as any | undefined;
    const httpHeaders = requestContext.request.http?.headers;

    const header = (name: string) => {
      if (!httpHeaders) return undefined;
      try {
        return httpHeaders.get(name) ?? undefined;
      } catch {
        return undefined;
      }
    };

    const requestId = lambdaEvent?.requestContext?.requestId || header('x-amzn-requestid') || header('x-request-id');
    const correlationId = header('x-correlation-id') || requestId;
    const operationName = requestContext.request.operationName || undefined;

    setRequestContext({ requestId, correlationId, operationName, userId: ctx.user?.id });

    log.info('graphql.request.start', {
      operationName,
    });

    return {
      async didResolveOperation(rc) {
        addToRequestContext({ operationName: rc.operationName || operationName });
      },
      async didEncounterErrors(rc) {
        const errs = rc.errors || [];
        // Log only names and messages to avoid leaking sensitive details
        log.error('graphql.request.errors', {
          errorsCount: errs.length,
          errors: errs.slice(0, 3).map((e) => ({ name: e.name, message: e.message })),
        });
      },
      async willSendResponse(rc) {
        const end = process.hrtime.bigint();
        const durationMs = Number(end - start) / 1_000_000;
        const errorsCount = rc.errors?.length || 0;
        if (errorsCount > 0) {
          log.warn('graphql.request.end', { durationMs, errorsCount });
        } else {
          log.info('graphql.request.end', { durationMs, errorsCount });
        }
      },
    };
  },
};

