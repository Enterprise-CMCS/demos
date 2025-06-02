import type { APIGatewayProxyEvent, Context as LambdaContext } from "aws-lambda";
import { ApolloServer } from "@apollo/server";
import { startServerAndCreateLambdaHandler } from "@apollo/server-lambda";
import { typeDefs, resolvers } from "./model/graphql.js";

interface SimpleContext {
  // define anything you actually need here (or leave empty)
}

// 1. Create your ApolloServer exactly as before (without auth inlined)
const server = new ApolloServer<SimpleContext>({
  typeDefs,
  resolvers,
});

// 2. Export a Lambda handler with a no-ops context
export const handler = startServerAndCreateLambdaHandler<SimpleContext>(
  server,
  {
    // This context() runs on every invocation. For now we just return an empty object.
    context: async ({ event, context }) => {
      // You can still inspect event.headers or event.body here if needed later.
      return {};
    },
  }
);
