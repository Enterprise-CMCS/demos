// server.ts
import { ApolloServer } from "@apollo/server";
import {
  startServerAndCreateLambdaHandler,
  handlers,
} from "@as-integrations/aws-lambda";
import { typeDefs, resolvers } from "./model/graphql.js";
import { authGatePlugin } from "./auth/auth.plugin.js";
import { loggingPlugin } from "./plugins/logging.plugin.js";
import {
  setRequestContext,
  addToRequestContext,
  log
} from "./logger.js";
import {
  GraphQLContext,
  buildLambdaContext,
  getDatabaseUrl,
} from "./auth/auth.util.js";

import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventHeaders,
} from "aws-lambda";

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
    typeof auth["cognito:username"] === "string" ? (auth["cognito:username"] as string) : undefined;
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
  process.env.DATABASE_URL = url;
  return url;
});

const server = new ApolloServer<GraphQLContext>({
  typeDefs,
  resolvers,
  plugins: [authGatePlugin, loggingPlugin],
});

export const graphqlHandler = startServerAndCreateLambdaHandler(
  server,
  handlers.createAPIGatewayProxyEventRequestHandler(),
  {
    context: async ({ event, context }) => {
      await databaseUrlPromise;
      const restEvent = event as APIGatewayProxyEvent;
      const claims = extractAuthorizerClaims(restEvent);
      // Pass claims to the existing builder via a header so we don't change its signature
      const headersWithClaims = withAuthorizerHeader(restEvent.headers, claims);
      // Seed request logging context early
      const requestId = restEvent?.requestContext?.requestId;
      const correlationId = restEvent?.headers?.["x-correlation-id"] || requestId;
      setRequestContext({ requestId, correlationId });
      if (claims?.sub) addToRequestContext({ userId: claims.sub });

      const gqlCtx = await buildLambdaContext(headersWithClaims);

      // Enrich context with resolved user id
      if (gqlCtx?.user?.id) addToRequestContext({ userId: gqlCtx.user.id });

      log.debug("lambda.context.built");

      return {
        ...gqlCtx,
        lambdaEvent: event,
        lambdaContext: context,
      };
    },
  }
);
