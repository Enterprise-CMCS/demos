import React, { createContext, useContext, useMemo, useEffect } from "react";
import { useQuery, ApolloError, ApolloQueryResult } from "@apollo/client";
import { useAuth } from "react-oidc-context";
import { GET_CURRENT_USER_QUERY } from "../../hooks/useCurrentUser";
import { PersonType } from "demos-server";

type CurrentUser = {
  id: string;
  username: string;
  email: string;
  fullName: string;
  displayName: string;
  personTypeId: PersonType;
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
  const token = auth.user?.id_token ?? null;
  const shouldQuery = !!token && auth.isAuthenticated && !auth.isLoading;
  const {
    data,
    loading: qLoading,
    error,
    refetch,
  } = useQuery(GET_CURRENT_USER_QUERY, {
    fetchPolicy: "cache-first",
    skip: !shouldQuery,
    errorPolicy: "ignore",
    notifyOnNetworkStatusChange: true,
  });

  useEffect(() => {
    if (shouldQuery) {
      refetch().catch(() => {});
    }
  }, [shouldQuery, token, refetch]);

  const currentUser = (shouldQuery ? (data?.currentUser as CurrentUser | undefined) : null) ?? null;
  const loading = auth.isLoading || (shouldQuery && qLoading);
  const userContextValues = useMemo<UserContextValue>(
    () => ({
      currentUser,
      loading,
      error,
      refresh: () => refetch(),
      // Setting the ground work for roles
      hasRole: (name) => currentUser?.personTypeId === name,
    }),
    [currentUser, loading, error, refetch]
  );
  return <Ctx.Provider value={userContextValues}>{children}</Ctx.Provider>;
}

export function getCurrentUser() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("getCurrentUser must be used within <UserProvider>");
  }
  return ctx;
}
