// src/contexts/UserContext.tsx
import React, { createContext, useContext, useMemo, useEffect } from "react";
import { useQuery, ApolloError, ApolloQueryResult } from "@apollo/client";
import { useAuth } from "react-oidc-context";
import { GET_CURRENT_USER_QUERY } from "../../hooks/useCurrentUser";

type CurrentUser = {
  id: string;
  email: string;
  displayName: string;
  roles: { id: string; name: string }[];
};

type UserContextValue = {
  currentUser: CurrentUser | null;
  loading: boolean;
  error?: ApolloError;
  refresh: () => Promise<ApolloQueryResult<{ currentUser: CurrentUser }>>;
  hasRole: (name: string) => boolean;
};

const Ctx = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { data, loading, error, refetch } = useQuery(GET_CURRENT_USER_QUERY, {
    fetchPolicy: "cache-first",
  });
  console.log("This is working");
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isLoading) {
      refetch().catch(() => {});
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.user, refetch]);

  const currentUser = (data?.currentUser as CurrentUser | undefined) ?? null;

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

export function useCurrentUser() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    if (import.meta.env.DEV) {
      console.warn("useCurrentUser used outside <UserProvider>");
      return {
        currentUser: null,
        loading: false,
        error: undefined,
        refresh: async () => Promise.resolve({} as any),
        hasRole: () => false,
      } as const;
    }
    throw new Error("useCurrentUser must be used within <UserProvider>");
  }
  return ctx;
}
