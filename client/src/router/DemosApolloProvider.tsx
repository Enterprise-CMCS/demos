import React, { useMemo } from "react";
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
import { useAuth } from "react-oidc-context";

const GRAPHQL_ENDPOINT = import.meta.env.VITE_API_URL_PREFIX ?? "/graphql";

export const DemosApolloProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();

  if (shouldUseMocks()) {
    return (
      <MockedProvider mocks={ALL_MOCKS} addTypename={false}>
        {children}
      </MockedProvider>
    );
  }

  // Read token per request (not just once)
  const authLink: ApolloLink = useMemo(
    () =>
      setContext((_, { headers }) => {
        const token = auth.user?.id_token ?? auth.user?.access_token ?? null;
        return {
          headers: {
            ...headers,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        };
      }),
    [auth.user] // rebuild link when user changes
  );

  const httpLink = useMemo(() => createHttpLink({ uri: GRAPHQL_ENDPOINT }), []);

  const client = useMemo(
    () =>
      new ApolloClient({
        link: authLink.concat(httpLink),
        cache: new InMemoryCache(),
      }),
    [authLink, httpLink]
  );

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
};
