// server.ts
import { ApolloServer } from "@apollo/server";
import {
  startServerAndCreateLambdaHandler,
  handlers,
} from "@as-integrations/aws-lambda";
import { typeDefs, resolvers } from "./model/graphql.js";
import {
  GraphQLContext,
  buildLambdaContext,
  getDatabaseUrl,
} from "./auth/auth.util.js";

import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyEventHeaders,
  APIGatewayEventRequestContext,
  APIGatewayEventRequestContextV2,
} from "aws-lambda";

type LambdaEvent = APIGatewayProxyEvent | APIGatewayProxyEventV2;

type JwtClaims = { sub: string; email?: string };

function isV2Context(
  ctx: APIGatewayEventRequestContext | APIGatewayEventRequestContextV2
): ctx is APIGatewayEventRequestContextV2 {
  return "http" in ctx;
}

function extractAuthorizerClaims(event: LambdaEvent): JwtClaims | null {
  const rc = event.requestContext;
  if (isV2Context(rc)) {
    // HTTP API (v2): requestContext.authorizer.jwt.claims See if this exists!
    const claims = (rc as APIGatewayEventRequestContextV2 & {
      authorizer?: {
        jwt?: {
          claims?: Record<string, unknown>
        }
      }
    }).authorizer?.jwt?.claims;
    if (claims && typeof claims === "object") {
      const subVal = (claims as Record<string, unknown>).sub;
      if (typeof subVal !== "string" || !subVal) return null;
      const emailVal = (claims as Record<string, unknown>).email;
      const email = typeof emailVal === "string" ? emailVal : undefined;
      return { sub: subVal, email };
    }
  } else {
    // REST API (v1): requestContext.authorizer.claims
    const auth = (rc.authorizer ?? {}) as { claims?: Record<string, unknown> };
    const claims = auth.claims;
    if (claims && typeof claims === "object") {
      const sub = typeof claims.sub === "string" ? claims.sub : "";
      if (!sub) return null;
      const email = typeof claims.email === "string" ? claims.email : undefined;
      return { sub, email };
    }
  }
  return null;
}

function withAuthorizerHeader(
  headers: APIGatewayProxyEventHeaders,
  claims: JwtClaims | null
): APIGatewayProxyEventHeaders {
  return claims
    ? { ...headers, "x-authorizer-claims": JSON.stringify(claims) }
    : headers;
}

const databaseUrlPromise = getDatabaseUrl()
  .then((url) => {
    process.env.DATABASE_URL = url;
    return url;
  })
  .catch((error) => {
    console.error("Failed to get database URL:", error);
    throw error;
  });

const server = new ApolloServer<GraphQLContext>({ typeDefs, resolvers });

export const graphqlHandler = startServerAndCreateLambdaHandler(
  server,
  handlers.createAPIGatewayProxyEventRequestHandler(),
  {
    context: async ({ event, context }) => {
      await databaseUrlPromise;

      const claims = extractAuthorizerClaims(event as LambdaEvent);
      const headersWithClaims = withAuthorizerHeader(event.headers, claims);

      const gqlCtx = await buildLambdaContext(headersWithClaims);

      return {
        ...gqlCtx,
        lambdaEvent: event,
        lambdaContext: context,
      };
    },
  }
);
