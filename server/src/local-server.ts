import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { typeDefs, resolvers } from "./model/graphql.js";
import {
  GraphQLContext,
  getCognitoUserInfo,
  getUserRoles,
} from "./auth/auth.util.js";
import { prisma } from "./prismaClient.js";

const server = new ApolloServer<GraphQLContext>({
  typeDefs,
  resolvers,
  introspection: process.env.ALLOW_INTROSPECTION === "true",
});

// local-server.ts
const { url } = await startStandaloneServer<GraphQLContext>(server, {
  listen: { port: 4000 },
  context: async ({ req }): Promise<GraphQLContext> => {
    const authHeader = req.headers.authorization ?? "";
    const hasBearer = authHeader.startsWith("Bearer ");
    console.log("[auth] header present:", !!authHeader, "bearer:", hasBearer);

    if (!hasBearer) {
      // anonymous context
      return { user: null };
    }

    try {
      const { sub, email } = await getCognitoUserInfo(req);

      const dbUser = await prisma().user.upsert({
        where: { cognitoSubject: sub },
        update: { email },
        create: {
          cognitoSubject: sub,
          username: email.split("@")[0],
          email,
          fullName: email,
          displayName: email.split("@")[0],
        },
      });

      const roles = await getUserRoles(sub);

      return { user: { id: dbUser.id, roles } };
    } catch (err) {
      console.error("[auth] context error:", err);
      // fail closed for protected resolvers, but don't 500 the whole request
      return { user: null };
    }
  },
});

console.log(`🚀 Server listening at: ${url}`);
