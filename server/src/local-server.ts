import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { typeDefs, resolvers } from "./model/graphql.js";
import {
  GraphQLContext,
  buildHttpContext,
} from "./auth/auth.util.js";

const server = new ApolloServer<GraphQLContext>({
  typeDefs,
  resolvers,
  introspection: process.env.ALLOW_INTROSPECTION === "true",
});

const { url } = await startStandaloneServer<GraphQLContext>(server, {
  listen: { port: 4000 },
  context: async ({ req }) => buildHttpContext(req),
});

console.log(`🚀 Server listening at: ${url}`);
