// server.ts
import { ApolloServer } from "@apollo/server";
import { ApolloArmor } from "@escape.tech/graphql-armor";
import { startServerAndCreateLambdaHandler, handlers } from "@as-integrations/aws-lambda";
import { GraphQLArmorConfig } from "./plugins/graphQLArmorConfig.js";
import { typeDefs, resolvers } from "./model/graphql.js";
import { authGatePlugin } from "./auth/auth.plugin.js";
import { loggingPlugin } from "./plugins/logging.plugin";
import {
  AuthorizationClaims,
  GraphQLContext,
  buildContextFromClaims,
  validateClaims,
} from "./auth/auth.util.js";
import { log, reqIdChild, als, store } from "./log.js";
import type { APIGatewayProxyEvent } from "aws-lambda";
import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";

log.info({ type: "graphql.startup.loaded" });

export async function getDatabaseUrl(): Promise<string> {
  const secretArn = process.env.DATABASE_SECRET_ARN;

  log.debug({ type: "graphql.db.creds_request" });

  const secretsManager = new SecretsManagerClient({ region: process.env.AWS_REGION });
  const response = await secretsManager.send(new GetSecretValueCommand({ SecretId: secretArn }));

  if (!response.SecretString) throw new Error("The SecretString value is undefined!");
  const s = JSON.parse(response.SecretString);
  return `postgresql://${s.username}:${s.password}@${s.host}:${s.port}/${s.dbname}?schema=demos_app`;
}

const setDatabaseUrl = async () => {
  const url = await getDatabaseUrl();
  log.debug({ type: "graphql.db.creds_retrieved" });
  process.env.DATABASE_URL = url;
  return url;
};

const armor = new ApolloArmor(GraphQLArmorConfig);
const protection = armor.protect();

const server = new ApolloServer<GraphQLContext>({
  typeDefs,
  resolvers,
  ...protection,
  plugins: [...protection.plugins, authGatePlugin, loggingPlugin],
  validationRules: [...protection.validationRules],
  formatError: (formattedError, error) => {
    log.debug({ error, type: "graphql.request.error" });
    return formattedError;
  },
  logger: log,
});
export function extractClaimsFromEvent(event: APIGatewayProxyEvent): AuthorizationClaims {
  const authorizer = event.requestContext.authorizer;
  if (!authorizer) {
    throw new Error("Missing authorizer in request context");
  }

  const claims = {
    email: authorizer.email,
    sub: authorizer.sub,
    role: authorizer.role,
    givenName: authorizer.given_name,
    familyName: authorizer.family_name,
    externalUserId: authorizer.userId,
  };
  validateClaims(claims);
  return claims;
}

export const graphqlHandler = startServerAndCreateLambdaHandler(
  server,
  handlers.createAPIGatewayProxyEventRequestHandler(),
  {
    context: async ({ event, context }) =>
      als.run(store, async () => {
        try {
          await setDatabaseUrl();

          const claims = extractClaimsFromEvent(event);
          const gqlCtx = await buildContextFromClaims(claims);

          const additionalContext = {
            callerUserId: gqlCtx?.user?.id,
            correlationId: event.headers?.["x-correlation-id"],
            callerCognitoSub: claims?.sub,
          };

          const reqLog = reqIdChild(context.awsRequestId, additionalContext);

          reqLog.debug({ type: "lambda.context.built" });

          return {
            ...gqlCtx,
            lambdaEvent: event,
            lambdaContext: context,
            log: reqLog,
          };
        } catch (error) {
          log.error({ type: "lambda.context.error" }, (error as Error).toString());
          throw error;
        }
      }),
  }
);
