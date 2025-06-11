import React from "react";
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  createHttpLink,
} from "@apollo/client";
import { MockedProvider } from "@apollo/client/testing";
import { ALL_MOCKS } from "mock-data";

const createApolloClient = () => {
  const httpLink = createHttpLink({
    uri:
      process.env.NODE_ENV === "development"
        ? "http://localhost:4000" // Local GraphQL server
        : "/graphql", // Production API Gateway endpoint
  });

  return new ApolloClient({
    link: httpLink,
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        errorPolicy: "all",
      },
      query: {
        errorPolicy: "all",
      },
    },
  });
};

export const DemosApolloProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const useMocks =
    process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";

  if (useMocks) {
    return (
      <MockedProvider mocks={ALL_MOCKS} addTypename={false}>
        {children}
      </MockedProvider>
    );
  } else {
    const client = createApolloClient();
    return <ApolloProvider client={client}>{children}</ApolloProvider>;
  }
};
