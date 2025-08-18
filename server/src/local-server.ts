import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { typeDefs, resolvers } from "./model/graphql.js";
import {
  GraphQLContext,
  getCognitoUserInfo,
  getUserRoles,
} from "./auth/auth.util.js";
import { prisma } from "./prismaClient.js"; // Add this import

const server = new ApolloServer<GraphQLContext>({
  typeDefs,
  resolvers,
  introspection: process.env.ALLOW_INTROSPECTION === "true",
});

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
  context: async ({ req }) => {
    // Add any shared context here, e.g., user authentication
    const { sub, email } = await getCognitoUserInfo(req);

    // Look up user by cognitoSubject
    const user = await prisma().user.findUnique({
      where: { cognitoSubject: sub },
    });

    const roles = await getUserRoles(sub);
    return {
      user: user ? { ...user, roles } : null,
    };
  },
});

console.log(`🚀 Server listening at: ${url}`);
