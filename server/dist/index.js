import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { typeDefs, resolvers } from "./model/graphql.js";
import { getCognitoUserInfo, getUserRoles, } from "./auth/auth.util.js";
const server = new ApolloServer({
    typeDefs,
    resolvers,
});
const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
    context: async ({ req }) => {
        // Add any shared context here, e.g., user authentication
        const { sub, email } = await getCognitoUserInfo(req);
        const roles = await getUserRoles(sub);
        return { user: { id: sub, name: email, roles } };
    },
});
console.log(`🚀 Server listening at: ${url}`);
//# sourceMappingURL=index.js.map