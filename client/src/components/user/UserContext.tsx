import React, { createContext, useContext, useMemo, useEffect } from "react";
import { useQuery, ApolloError, ApolloQueryResult } from "@apollo/client";
import { useAuth } from "react-oidc-context";
import { GET_CURRENT_USER_QUERY } from "../../hooks/useCurrentUser";

type CurrentUser = {
  id: string;
  username: string;
  email: string;
  fullName: string;
  displayName: string;
  roles: { id: string; name: string }[];
};

type UserContextValue = {
  currentUser: CurrentUser | null;
  loading: boolean;
  error?: ApolloError | undefined | null;
  refresh: () => Promise<ApolloQueryResult<{ currentUser: CurrentUser }>>;
  hasRole: (name: string) => boolean;
};

const Ctx = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const shouldQuery = auth.isAuthenticated && !!auth.user && !auth.isLoading;
  const { data, loading: qLoading, error, refetch } = useQuery(GET_CURRENT_USER_QUERY, {
    fetchPolicy: "cache-first",
    skip: !shouldQuery,
    errorPolicy: "ignore",
  });

  useEffect(() => {
    if (shouldQuery) refetch().catch(() => {});
  }, [shouldQuery, refetch]);

  const currentUser = (data?.currentUser as CurrentUser | undefined) ?? null;
  const loading = auth.isLoading || qLoading;

  const value = useMemo<UserContextValue>(
    () => ({
      currentUser,
      loading,
      error,
      refresh: () => refetch(),
      hasRole: (name) => !!currentUser?.roles?.some(r => r.name === name),
    }),
    [currentUser, loading, error, refetch]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function getCurrentUser() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("getCurrentUser must be used within <UserProvider>");
  }
  return ctx;
}
