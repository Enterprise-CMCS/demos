import React, { createContext, useContext } from "react";
import { useQuery, gql } from "@apollo/client";
import { useAuth } from "react-oidc-context";
import { Person, User } from "demos-server";

type CurrentUser = Pick<User, "id" | "username"> & {
  person: Pick<Person, "id" | "personType" | "fullName" | "firstName" | "lastName" | "email">;
};

export const GET_CURRENT_USER_QUERY = gql`
  query GetCurrentUser {
    currentUser {
      id
      username
      person {
        id
        personType
        fullName
        firstName
        lastName
        email
      }
    }
  }
`;

interface UserContextValue {
  currentUser: CurrentUser;
}

const Ctx = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const shouldQuery = auth.isAuthenticated && !auth.isLoading;

  const { data, loading, error } = useQuery(GET_CURRENT_USER_QUERY, {
    fetchPolicy: "cache-first",
    skip: !shouldQuery,
  });

  // Don't load anything until we know auth status
  if (loading || !shouldQuery) {
    return null;
  }

  if (error) {
    const errorMessage = "[UserProvider] Error fetching current user. ";
    console.error(errorMessage, error);
    return null;
  }

  if (!data || !data.currentUser) {
    const errorMessage = "[UserProvider] Error fetching current user. ";
    console.error(errorMessage);
    return null;
  }

  return <Ctx.Provider value={{ currentUser: data.currentUser }}>{children}</Ctx.Provider>;
}

export function getCurrentUser() {
  const ctx = useContext(Ctx);

  if (!ctx) {
    throw new Error("getCurrentUser must be used within <UserProvider>");
  }

  return ctx;
}
