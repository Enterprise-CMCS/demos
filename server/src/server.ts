import { ApolloServer, BaseContext } from '@apollo/server';
import {
    startServerAndCreateLambdaHandler,
    handlers,
} from '@as-integrations/aws-lambda';
import { typeDefs, resolvers } from "./model/graphql.js";
import {
    getCognitoUserInfoForLambda,
    getUserRoles,
} from "./auth/auth.util.js";


const server = new ApolloServer<BaseContext>({
    typeDefs,
    resolvers
});


export const graphqlHandler = startServerAndCreateLambdaHandler(
    server,
    handlers.createAPIGatewayProxyEventV2RequestHandler(),
    {
        context: async ({ event, context }) => {
            // Add any shared context here, e.g., user authentication
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
