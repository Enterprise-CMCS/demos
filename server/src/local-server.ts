import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { typeDefs, resolvers } from "./model/graphql.js";
import { buildHttpContext, type GraphQLContext } from "./auth/auth.util.js";
import { authGatePlugin } from "./auth/auth.plugin.js";
import { gatedLandingPagePlugin } from "./plugins/gatedLandingPage.plugin.js";
import { loggingPlugin } from "./plugins/logging.plugin.js";
import { setRequestContext, addToRequestContext } from "./logger.js";

const server = new ApolloServer<GraphQLContext>({
  typeDefs,
  resolvers,
  introspection: process.env.ALLOW_INTROSPECTION === "true",
  plugins: [authGatePlugin, gatedLandingPagePlugin(), loggingPlugin],
});

const { url } = await startStandaloneServer<GraphQLContext>(server, {
  listen: { port: 4000 },
  context: async ({ req }) => {
    // Minimal context for local dev
    const requestId = (req.headers["x-request-id"] as string | undefined) || Math.random().toString(36).slice(2);
    const correlationId = (req.headers["x-correlation-id"] as string | undefined) || requestId;
    setRequestContext({ requestId, correlationId });
    const ctx = await buildHttpContext(req);
    if (ctx?.user?.id) addToRequestContext({ userId: ctx.user.id });
    return ctx;
  },
});

console.log(`🚀 Server listening at: ${url}`);
