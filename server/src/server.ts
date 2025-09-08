// server.ts
import { ApolloServer } from "@apollo/server";
import {
  startServerAndCreateLambdaHandler,
  handlers,
} from "@as-integrations/aws-lambda";
import { typeDefs, resolvers } from "./model/graphql.js";
import { authGatePlugin } from "./auth/auth.plugin.js";
import {
  GraphQLContext,
  buildLambdaContext,
  getDatabaseUrl,
} from "./auth/auth.util.js";

import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventHeaders,
} from "aws-lambda";

type JwtClaims = { sub: string; email?: string };

function extractAuthorizerClaims(event: APIGatewayProxyEvent): JwtClaims | null {
  // In REST custom authorizer, requestContext.authorizer is a flat map of strings
  const auth = (event.requestContext?.authorizer ?? {}) as Record<string, unknown>;
  const sub = typeof auth.sub === "string" && auth.sub.length > 0 ? auth.sub : null;
  const email = typeof auth.email === "string" ? auth.email : undefined;
  if (!sub) return null;

  return { sub, email };
}

function withAuthorizerHeader(
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
  plugins: [authGatePlugin],
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
      const gqlCtx = await buildLambdaContext(headersWithClaims);

      return {
        ...gqlCtx,
        lambdaEvent: event,
        lambdaContext: context,
      };
    },
  }
);
