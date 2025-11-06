import React, { createContext, useContext } from "react";
import { useQuery, gql } from "@apollo/client";
import { useAuth } from "react-oidc-context";
import { Person, User } from "demos-server";
import { Loading } from "components/loading/Loading";

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
  currentUser?: CurrentUser;
}

const Ctx = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();

  const { data, loading, error } = useQuery(GET_CURRENT_USER_QUERY, {
    skip: !auth.isAuthenticated,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen">
        <Loading />
      </div>
    );
  }

  if (error) {
    console.error("[UserProvider] Error fetching current user. ", error);
  }

  return <Ctx.Provider value={{ currentUser: data?.currentUser }}>{children}</Ctx.Provider>;
}

export function getCurrentUser() {
  const ctx = useContext(Ctx);

  if (!ctx) {
    throw new Error("getCurrentUser must be used within <UserProvider>");
  }

  return ctx;
}
