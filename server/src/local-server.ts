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

const { url } = await startStandaloneServer<GraphQLContext>(server, {
  listen: { port: 4000 },
  context: async ({ req }): Promise<GraphQLContext> => {
    const authHeader = req.headers.authorization ?? "";
    const hasBearer = authHeader.startsWith("Bearer ");
    console.log("[auth] header present:", !!authHeader, "bearer:", hasBearer);
    if (!hasBearer) {
      return { user: null };
    }
    try {
      const { sub, email: jwtEmail } = await getCognitoUserInfo(req);
      // Provide safe values when email is missing in the token
      const username =
        (jwtEmail && jwtEmail.includes("@"))
          ? jwtEmail.split("@")[0]
          : sub; // fall back to sub

      const displayName = username;
      const emailForCreate = jwtEmail ?? `${sub}@no-email.local`; // any deterministic placeholder
      const fullName = jwtEmail ?? username;
      const dbUser = await prisma().user.upsert({
        where: { cognitoSubject: sub },
        update: {
          ...(jwtEmail ? { email: jwtEmail } : {}),
        },
        create: {
          cognitoSubject: sub,
          username,
          email: emailForCreate,
          fullName,
          displayName,
        },
      });

      const roles = await getUserRoles(sub);
      return { user: { id: dbUser.id, roles } };
    } catch (err) {
      console.error("[auth] context error:", err);
      return { user: null };
    }
  },
});


console.log(`🚀 Server listening at: ${url}`);
