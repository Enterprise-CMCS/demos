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

export function syncTokensToCookiesInLocal(idToken: string, accessToken: string) {
  if (!isLocalDevelopment()) return;
  const opts = "; Path=/; SameSite=Lax";
  // document.cookie assignments are additive — each assignment sets one cookie.
  // Snyk doesn't like that we don't use the Secure flag here
  // but this only called in local dev where https is not used.
  const cookies = [
    idToken ? `id_token=${encodeURIComponent(idToken)}${opts}` : `id_token=; Max-Age=0${opts}`,
    accessToken
      ? `access_token=${encodeURIComponent(accessToken)}${opts}`
      : `access_token=; Max-Age=0${opts}`,
  ];
  for (const cookie of cookies) {
    document.cookie = cookie;
  }
}

export const DemosApolloProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();

  if (shouldUseMocks()) {
    return (
      <MockedProvider mocks={ALL_MOCKS}>
        {children}
      </MockedProvider>
    );
  }

  // In local development, mirror tokens to cookies since we don't
  // go through the backend's /auth/callback route where they would normally be set.
  useEffect(() => {
    syncTokensToCookiesInLocal(auth.user?.id_token ?? "", auth.user?.access_token ?? "");
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
                tags: {
                  merge: false,
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
