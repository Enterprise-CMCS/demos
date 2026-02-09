import React, { useEffect, useMemo } from "react";
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
import { shouldUseMocks, isLocalDevelopment } from "config/env";
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

  // Mirror tokens into cookies for Apollo Sandbox (local dev only)
  useEffect(() => {
    if (!isLocalDevelopment()) return;
    const idToken = auth.user?.id_token ?? "";
    const accessToken = auth.user?.access_token ?? "";
    const opts = "; Path=/; SameSite=Lax";
    if (idToken) {
      document.cookie = `id_token=${encodeURIComponent(idToken)}${opts}`;
    } else {
      document.cookie = `id_token=; Max-Age=0${opts}`;
    }
    if (accessToken) {
      document.cookie = `access_token=${encodeURIComponent(accessToken)}${opts}`;
    } else {
      document.cookie = `access_token=; Max-Age=0${opts}`;
    }
  }, [auth.user]);

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
    [auth.user]
  );

  const httpLink = useMemo(() => createHttpLink({ uri: GRAPHQL_ENDPOINT }), []);

  const client = useMemo(
    () =>
      new ApolloClient({
        link: authLink.concat(httpLink),
        cache: new InMemoryCache({
          typePolicies: {
            Demonstration: {
              fields: {
                demonstrationTypes: {
                  merge: false,
                },
              },
            },
            Document: {
              fields: {
                presignedDownloadUrl: {
                  read() {
                    return undefined;
                  },
                },
              },
            },
          },
        }),
      }),
    [authLink, httpLink]
  );

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
};
