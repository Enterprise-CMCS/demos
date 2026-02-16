import { randomUUID } from "node:crypto";
import { ApolloServer } from "@apollo/server";
import { ApolloArmor } from '@escape.tech/graphql-armor';
import { startStandaloneServer } from "@apollo/server/standalone";
import { typeDefs, resolvers } from "./model/graphql.js";
import { buildHttpContext, type GraphQLContext } from "./auth/auth.util.js";
import { authGatePlugin } from "./auth/auth.plugin.js";
import { gatedLandingPagePlugin } from "./plugins/gatedLandingPage.plugin.js";
import { als, log, reqIdChild, store } from "./log.js";
import { loggingPlugin } from "./plugins/logging.plugin";
import { GraphQLArmorConfig } from "./plugins/graphQLArmorConfig.js";

log.debug("Starting server...");

const armor = new ApolloArmor(GraphQLArmorConfig);
const protection = armor.protect();

const server = new ApolloServer<GraphQLContext>({
  typeDefs,
  resolvers,
  introspection: process.env.ALLOW_INTROSPECTION === "true",
  ...protection,  
  plugins: [...protection.plugins, authGatePlugin, gatedLandingPagePlugin(), loggingPlugin],
  validationRules: [...protection.validationRules]
});

const { url } = await startStandaloneServer<GraphQLContext>(server, {
  listen: { port: 4000 },
  context: async ({ req }) =>
    als.run(store, async () => {
      // Minimal context for local dev
      const requestId = (req.headers["x-request-id"] as string | undefined) || randomUUID();
      const ctx = await buildHttpContext(req);

      const additionalContext = {
        callerUserId: ctx?.user?.id,
        correlationId: (req.headers["x-correlation-id"] as string | undefined) || requestId,
      };

      const reqLog = reqIdChild(requestId, additionalContext);
      als.getStore()?.set("logger", reqLog);

      return {
        ...ctx,
        log: reqLog,
      };
    }),
});

log.info(`🚀 Server listening 👂 at: ${url}`);
