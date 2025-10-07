import { randomUUID } from "node:crypto";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { typeDefs, resolvers } from "./model/graphql.js";
import { buildHttpContext, type GraphQLContext } from "./auth/auth.util.js";
import { authGatePlugin } from "./auth/auth.plugin.js";
import { gatedLandingPagePlugin } from "./plugins/gatedLandingPage.plugin.js";
import { loggingPlugin } from "./plugins/logging.plugin.js";
import { setRequestContext, addToRequestContext, log } from "./logger.js";
import { GraphQLError, GraphQLFormattedError } from "graphql";

function formatError(error: GraphQLFormattedError) {
  if (error.extensions?.code === "EXAMPLE_TEST_ERROR_CODE") {
    const newError = new GraphQLError("This is an example of custom error handling.", {
      extensions: {
        code: error.extensions.code,
      },
    });
    return newError;
  }
  return new GraphQLError("Something went horribly awry!");
}

const server = new ApolloServer<GraphQLContext>({
  typeDefs,
  resolvers,
  introspection: process.env.ALLOW_INTROSPECTION === "true",
  plugins: [authGatePlugin, gatedLandingPagePlugin(), loggingPlugin],
  formatError: formatError,
});

const { url } = await startStandaloneServer<GraphQLContext>(server, {
  listen: { port: 4000 },
  context: async ({ req }) => {
    log.debug("Starting server...");
    // Minimal context for local dev
    const requestId = (req.headers["x-request-id"] as string | undefined) || randomUUID();
    const correlationId = (req.headers["x-correlation-id"] as string | undefined) || requestId;
    setRequestContext({ requestId, correlationId });
    const ctx = await buildHttpContext(req);
    if (ctx?.user?.id) {
      addToRequestContext({ userId: ctx.user.id });
    }
    return ctx;
  },
});

log.info(`🚀 Server listening 👂 at: ${url}`);
