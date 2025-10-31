// server.ts
import { ApolloServer } from "@apollo/server";
import { startServerAndCreateLambdaHandler, handlers } from "@as-integrations/aws-lambda";
import { typeDefs, resolvers } from "./model/graphql.js";
import { authGatePlugin } from "./auth/auth.plugin.js";
import {loggingPlugin} from "./plugins/logging.plugin"
import { GraphQLContext, buildLambdaContext, getDatabaseUrl } from "./auth/auth.util.js";
import { log, reqIdChild, als, store } from "./log.js";

import type { APIGatewayProxyEvent, APIGatewayProxyEventHeaders } from "aws-lambda";

log.info({type: "graphql.startup.loaded"});

type JwtClaims = {
  sub: string;
  email?: string;
  role?: string;
  familyName?: string;
  givenName?: string;
  identities?: unknown;
};

export function extractAuthorizerClaims(event: APIGatewayProxyEvent): JwtClaims | null {
  const auth = (event.requestContext?.authorizer ?? {}) as Record<string, unknown>;
  const sub        = typeof auth.sub === "string" && auth.sub ? auth.sub : null;
  const email      = typeof auth.email === "string" ? auth.email : undefined;
  const role       = typeof auth.role === "string" ? auth.role : undefined;
  const familyName = typeof auth.family_name === "string" ? auth.family_name : undefined;
  const givenName  = typeof auth.given_name === "string" ? auth.given_name : undefined;
  if (!sub) return null;
  const identities = auth.identities;
  const cognitoUsername =
    typeof auth["cognito:username"] === "string" ? auth["cognito:username"] : undefined;

  return {
    sub,
    email,
    role,
    givenName,
    familyName,
    identities,
    "cognito:username": cognitoUsername,
  } as JwtClaims & Record<string, unknown>;
}

export function withAuthorizerHeader(
  headers: APIGatewayProxyEventHeaders,
  claims: JwtClaims | null
): APIGatewayProxyEventHeaders {
  return claims
    ? { ...headers, "x-authorizer-claims": JSON.stringify(claims) }
    : headers;
}

const databaseUrlPromise = getDatabaseUrl().then((url) => {
  log.debug({type: "graphql.db.creds_retrieved"});
  process.env.DATABASE_URL = url;
  return url;
});

const server = new ApolloServer<GraphQLContext>({
  typeDefs,
  resolvers,
  plugins: [authGatePlugin, loggingPlugin],
  formatError: (formattedError, error) => {
    log.debug({ error, type: "graphql.request.error" });
    return formattedError;
  },
  logger: log,
});

export const graphqlHandler = startServerAndCreateLambdaHandler(
  server,
  handlers.createAPIGatewayProxyEventRequestHandler(),
  {
    context: async ({ event, context }) =>
      als.run(store, async () => {
        try {
          await databaseUrlPromise;
          const restEvent = event;
          const claims = extractAuthorizerClaims(restEvent);
          // Pass claims to the existing builder via a header so we don't change its signature
          const headersWithClaims = withAuthorizerHeader(restEvent.headers, claims);

          const gqlCtx = await buildLambdaContext(headersWithClaims);

          const additionalContext = {
            callerUserId: gqlCtx?.user?.id,
            correlationId: restEvent?.headers?.["x-correlation-id"],
            callerCognitoSub: claims?.sub
          }

          const reqLog = reqIdChild(context.awsRequestId, additionalContext);

          reqLog.debug({type: "lambda.context.built"});

          return {
            ...gqlCtx,
            lambdaEvent: event,
            lambdaContext: context,
            log: reqLog,
          };
        } catch (error) {
          log.error({type: "lambda.context.error"},(error as Error).toString());
          throw error;
        }
      }),
  }
);
