import { ApolloServer } from "@apollo/server";
import {
  startServerAndCreateLambdaHandler,
  handlers,
} from "@as-integrations/aws-lambda";
import { typeDefs, resolvers } from "./model/graphql.js";
import { GraphQLContext, buildLambdaContext, getDatabaseUrl } from "./auth/auth.util.js";

const databaseUrlPromise = getDatabaseUrl()
  .then((url) => {
    process.env.DATABASE_URL = url;
    return url;
  })
  .catch((error) => {
    console.error("Failed to get database URL:", error);
    throw error;
  });

const server = new ApolloServer<GraphQLContext>({
  typeDefs,
  resolvers,
});

export const graphqlHandler = startServerAndCreateLambdaHandler(
  server,
  handlers.createAPIGatewayProxyEventRequestHandler(),
  {
    context: async ({ event, context }) => {
      await databaseUrlPromise;
      const gqlCtx = await buildLambdaContext(event.headers);

      return {
        ...gqlCtx,
        lambdaEvent: event,
        lambdaContext: context,
      };
    },
  }
);
