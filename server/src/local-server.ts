import { randomUUID } from "node:crypto";
import { ApolloServer } from "@apollo/server";
import { ApolloArmor } from "@escape.tech/graphql-armor";
import { startStandaloneServer } from "@apollo/server/standalone";
import { typeDefs, resolvers } from "./model/graphql.js";
import {
  buildContextFromClaims,
  AuthorizationClaims,
  type GraphQLContext,
  validateClaims,
} from "./auth/auth.util.js";
import { gatedLandingPagePlugin } from "./plugins/gatedLandingPage.plugin.js";
import { als, log, reqIdChild, store } from "./log.js";
import { loggingPlugin } from "./plugins/logging.plugin";
import { GraphQLArmorConfig } from "./plugins/graphQLArmorConfig.js";
import { JwtPayload } from "jsonwebtoken";
import { parseCookie } from "cookie";
import { decodeToken } from "./auth/decodeToken.js";
import { getPersonTypeFromClaims } from "./auth/getPersonTypeFromClaims.js";
import { fieldAuthPlugin } from "./plugins/fieldAuthPlugin.js";
import { formatGraphQLErrorCode } from "./errors/errorCodes.js";

log.debug("Starting server...");

const armor = new ApolloArmor(GraphQLArmorConfig);
const protection = armor.protect();

const server = new ApolloServer<GraphQLContext>({
  typeDefs,
  resolvers,
  ...protection,
  introspection: process.env.ALLOW_INTROSPECTION === "true",
  plugins: [...protection.plugins, loggingPlugin, fieldAuthPlugin, gatedLandingPagePlugin()],
  validationRules: [...protection.validationRules],
  formatError: formatGraphQLErrorCode,
  logger: log,
});

export function extractClaimsFromDecodedToken(decodedToken: JwtPayload): AuthorizationClaims {
  const externalUserId = decodedToken.identities?.[0]?.userId ?? decodedToken.email;

  const claims = {
    email: decodedToken.email,
    sub: decodedToken.sub,
    role: decodedToken["custom:roles"],
    givenName: decodedToken.given_name,
    familyName: decodedToken.family_name,
    externalUserId: externalUserId,
    authTime: new Date(decodedToken.auth_time * 1000),
  };
  validateClaims(claims);
  return claims;
}

const { url } = await startStandaloneServer<GraphQLContext>(server, {
  listen: { port: 4000 },
  context: async ({ req }) =>
    als.run(store, async () => {
      const token = parseCookie(req.headers.cookie || "")["id_token"];
      if (!token) {
        throw new Error("Missing Authorization header with Bearer token");
      }

      const decodedToken = await decodeToken(token);
      const claims = extractClaimsFromDecodedToken(decodedToken);
      // Validate that the claims map to a valid person type (role gate);
      // throws and rejects the request if the role is missing or ambiguous.
      getPersonTypeFromClaims(claims);
      const ctx = await buildContextFromClaims(claims);

      const requestId = (req.headers["x-request-id"] as string | undefined) || randomUUID();
      const additionalContext = {
        callerUserId: ctx?.user?.id,
        correlationId: (req.headers["x-correlation-id"] as string | undefined) || requestId,
      };

      const reqLog = reqIdChild(requestId, additionalContext);
      als.getStore()?.set("logger", reqLog);

      return {
        ...ctx,
        log: reqLog,
      };
    }),
});

log.info(`🚀 Server listening 👂 at: ${url}`);
