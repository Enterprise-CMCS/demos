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

const databaseUrlPromise = getDatabaseUrl().then(url => {
    process.env.DATABASE_URL = url;
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
            console.log("ENTRY...")
            await databaseUrlPromise;
            console.log("AFTER DB URL PROMISE")
            
            // Values from the user's id_token are set in /lambda_authorizer/index.mjs
            // and available here from event.requestContext.authorizer.<key>
            
            const { sub, email } = await getCognitoUserInfoForLambda(event.headers);
            console.log("AFTER COGNITO")
            const roles = await getUserRoles(sub);
            console.log("AFTER User ROles")
            return {
                user: { id: sub, name: email, roles },
                lambdaEvent: event,
                lambdaContext: context
            };
        },
    }
);
