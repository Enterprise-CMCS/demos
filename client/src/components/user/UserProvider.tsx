import React from "react";
import { useQuery, gql } from "@apollo/client";
import { LoadingScreen } from "components/loading";
import { Ctx } from "components/user/UserContext";
import { UserAuthenticationFailed } from "components/user/UserAuthenticationFailed";

export const NO_USER_FOUND_ERROR_MESSAGE =
  "No user record was found for the authenticated account.";

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

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { data, loading, error } = useQuery(GET_CURRENT_USER_QUERY);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <UserAuthenticationFailed errorMessage={error.message} />;
  }

  if (!data?.currentUser) {
    return <UserAuthenticationFailed errorMessage={NO_USER_FOUND_ERROR_MESSAGE} />;
  }

  // Provide the current user data to the rest of the app if auth succeeds
  return <Ctx.Provider value={{ currentUser: data.currentUser }}>{children}</Ctx.Provider>;
}
