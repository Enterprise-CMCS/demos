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
    const { sub, email } = await getCognitoUserInfo(req);

    // 1) check first (so we can log a clear "matched")
    const existing = await prisma().user.findUnique({
      where: { cognitoSubject: sub },
      select: { id: true, email: true, username: true },
    });

    let dbUser;
    // Debugging
    if (existing) {
      console.info("[auth] Matched existing user", {
        where: "cognitoSubject",
        cognitoSubject: sub,
        userId: existing.id,
      });
      dbUser = await prisma().user.update({
        where: { id: existing.id },
        data: { email }, // keep fresh if changed
      });
    } else {
      console.info("[auth] No existing user — creating", {
        where: "cognitoSubject",
        cognitoSubject: sub,
      });
      dbUser = await prisma().user.create({
        data: {
          cognitoSubject: sub,
          email,
          username: email.split("@")[0],
          fullName: email,
          displayName: email.split("@")[0],
        },
      });
      console.info("[auth] Created user", { userId: dbUser.id });
    }
    // END Debugging

    const roles = await getUserRoles(sub);

    // map to your context shape
    return { user: { id: dbUser.id, name: dbUser.email, roles } };
  },
});
console.log(`🚀 Server listening at: ${url}`);
