import React from "react";
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  createHttpLink,
} from "@apollo/client";
import { MockedProvider } from "@apollo/client/testing";
import { ALL_MOCKS } from "mock-data";

const GRAPHQL_ENDPOINT = "/graphql";

const createApolloClient = (uri: string) => {
  return new ApolloClient({
    link: createHttpLink({ uri }),
    cache: new InMemoryCache(),
  });
};

export const DemosApolloProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const isTest = process.env.NODE_ENV === "test";
  const isDevelopment = process.env.NODE_ENV === "development";

  // Always use mocks in tests
  // Use mocks in development mode if USE_MOCKS is set to true
  const useMocks =
    isTest || (isDevelopment && import.meta.env.VITE_USE_MOCKS === "true");

  if (useMocks) {
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
