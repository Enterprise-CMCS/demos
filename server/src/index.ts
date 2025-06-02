import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { typeDefs, resolvers } from "./model/graphql.js";
import {
  GraphQLContext,
  getCognitoUserInfo,
  getUserRoles,
} from "./auth/auth.util.js";

// Create the ApolloServer instance exactly as before:
const server = new ApolloServer<GraphQLContext>({
  typeDefs,
  resolvers,
});

// Only call startStandaloneServer when running locally (e.g., via `npm run dev`).
// You might guard this behind an environment variable check (e.g., NODE_ENV !== "production").
if (process.env.LOCAL_DEV === "true") {
  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
    context: async ({ req }) => {
      const { sub, email } = await getCognitoUserInfo(req);
      const roles = await getUserRoles(sub);
      return { user: { id: sub, name: email, roles } };
    },
  });

  console.log(`🚀 Local server listening at: ${url}`);
}
