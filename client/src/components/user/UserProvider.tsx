import React from "react";
import { useQuery, gql } from "@apollo/client";
import { useAuth } from "react-oidc-context";
import { Loading } from "components/loading/Loading";
import { Ctx, CurrentUser } from "components/user/UserContext";
import { UserAuthenticationFailed } from "components/user/UserAuthenticationFailed";

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
  const auth = useAuth();

  const { data, loading, error } = useQuery(GET_CURRENT_USER_QUERY, {
    skip: !auth.isAuthenticated,
  });

  // Render Loading state while authentication or user data is loading
  if (auth.isLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen">
        <Loading />
      </div>
    );
  }

  // Not yet authenticated — render children so withAuthenticationRequired can redirect
  if (!auth.isAuthenticated) {
    return <>{children}</>;
  }

  // Render authentication failure component if there was an error or no user data
  if (error || auth.error || !data?.currentUser) {
    const errorParts = [auth.error?.message, error?.message].filter(Boolean);
    return (
      <UserAuthenticationFailed
        name={auth.user?.profile.name}
        email={auth.user?.profile.email}
        errorMessage={errorParts.length > 0 ? errorParts.join("; ") : undefined}
      />
    );
  }

  // Provide the current user data to the rest of the app if auth succeeds
  return <Ctx.Provider value={{ currentUser: data.currentUser }}>{children}</Ctx.Provider>;
}

// A helper component for testing that allows us to provide a custom current user value
export function TestUserProvider({
  children,
  currentUser,
}: {
  children: React.ReactNode;
  currentUser: CurrentUser;
}) {
  return <Ctx.Provider value={{ currentUser }}>{children}</Ctx.Provider>;
}
