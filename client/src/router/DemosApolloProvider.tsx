import React from "react";
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  createHttpLink,
  ApolloLink,
} from "@apollo/client";
import { MockedProvider } from "@apollo/client/testing";
import { setContext } from "@apollo/client/link/context";
import { ALL_MOCKS } from "mock-data";
import { shouldUseMocks } from "config/env";
import { AuthState, useAuth } from "react-oidc-context";

const GRAPHQL_ENDPOINT = import.meta.env.VITE_API_URL_PREFIX ?? "/graphql";

const createApolloClient = (auth: AuthState) => {
  // Add the authorization header to each request sent by Apollo Client
  const setAuthHeaders: ApolloLink = setContext(
    (_, { headers: previousHeaders }) => {
      const token = auth.user?.id_token;
      const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

      const newHeaders = {
        headers: {
          ...previousHeaders,
          ...authHeader,
        },
      };

      return newHeaders;
    }
  );

  // Create the HTTP Link for Apollo Client, pointing to the GraphQL endpoint
  const httpLink: ApolloLink = createHttpLink({
    uri: GRAPHQL_ENDPOINT,
  });

  return new ApolloClient({
    link: setAuthHeaders.concat(httpLink),
    cache: new InMemoryCache(),
  });
};

export const DemosApolloProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const auth: AuthState = useAuth();

  if (shouldUseMocks()) {
    return (
      <MockedProvider mocks={ALL_MOCKS} addTypename={false}>
        {children}
      </MockedProvider>
    );
  } else {
    const apolloClient = createApolloClient(auth);

    return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>;
  }
};
