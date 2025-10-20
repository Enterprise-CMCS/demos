// Totally freestyling here
import type {
  ApolloServerPlugin,
  GraphQLRequestListener,
} from "@apollo/server";
import { GraphQLError } from "graphql";
import type { GraphQLContext } from "./auth.util";

const PUBLIC_FIELDS = new Set<string>([
  "Query.__schema",
  "Query.__type",
  "Query.health",
  "Query.loginStatus",
]);

export const authGatePlugin: ApolloServerPlugin<GraphQLContext> = {
  requestDidStart(): Promise<GraphQLRequestListener<GraphQLContext>> {
    return Promise.resolve({
      executionDidStart() {
        return Promise.resolve({
          willResolveField(fieldResolverParams) {
            const { info, contextValue } = fieldResolverParams;
            const path = `${info.parentType.name}.${info.fieldName}`;

            if (!contextValue?.user && !PUBLIC_FIELDS.has(path)) {
              throw new GraphQLError("User not authenticated", {
                extensions: { code: "UNAUTHENTICATED", http: { status: 401 } },
              });
            }
          },
        });
      },
    });
  },
};
