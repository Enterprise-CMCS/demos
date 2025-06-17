import React from "react";
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  createHttpLink,
} from "@apollo/client";
import { MockedProvider } from "@apollo/client/testing";
import { setContext } from "@apollo/client/link/context";
import { ALL_MOCKS } from "mock-data";
import { shouldUseMocks } from "config/env";

const GRAPHQL_ENDPOINT = "/graphql";

const createApolloClient = (uri: string) => {
  return new ApolloClient({
    link: setAuthHeaders.concat(createHttpLink({ uri })),
    cache: new InMemoryCache(),
  });
};

// Add the authorization header to each request sent by Apollo Client
const setAuthHeaders = setContext((_, { previousHeaders }) => {
  // const token = auth.user?.access_token;
  const token = "";

  return {
    headers: {
      ...previousHeaders,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

export const DemosApolloProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  if (shouldUseMocks()) {
    return (
      <MockedProvider mocks={ALL_MOCKS} addTypename={false}>
        {children}
      </MockedProvider>
    );
  } else {
    const apolloClient = createApolloClient(GRAPHQL_ENDPOINT);

    return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>;
  }
};
