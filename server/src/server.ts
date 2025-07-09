import { ApolloServer, BaseContext } from '@apollo/server';
import {
    startServerAndCreateLambdaHandler,
    handlers,
} from '@as-integrations/aws-lambda';
import { typeDefs, resolvers } from "./model/graphql.js";
import {
    getCognitoUserInfoForLambda,
    getUserRoles,
    getDatabaseUrl
} from "./auth/auth.util.js";
import { initializeClient } from './prismaClient.js';

const databaseUrlPromise = getDatabaseUrl().then(url => {
    process.env.DATABASE_URL = url;
    initializeClient()
    return url;
}).catch(error => {
    console.error("Failed to get database URL:", error);
    throw error;
});

const server = new ApolloServer<BaseContext>({
    typeDefs,
    resolvers
});

export const graphqlHandler = startServerAndCreateLambdaHandler(
    server,
    handlers.createAPIGatewayProxyEventRequestHandler(),
    {
        context: async ({ event, context }) => {
            // Add any shared context here, e.g., user authentication
            await databaseUrlPromise;

            const { sub, email } = await getCognitoUserInfoForLambda(event.headers);
            const roles = await getUserRoles(sub);
            return {
                user: { id: sub, name: email, roles },
                lambdaEvent: event,
                lambdaContext: context
            };
        },
    }
);
