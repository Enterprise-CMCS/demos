import React from "react";
import { UserProvider } from "components/user/UserProvider";
import { DemosApolloProvider } from "./DemosApolloProvider";
import { DemosAuthProvider } from "./DemosAuthProvider";
import { RequireAuthentication } from "./RequireAuthentication";
import { DemosRouter } from "./DemosRouter";

export const DemosBootstrap: React.FC = () => {
  return (
    <DemosAuthProvider>
      <RequireAuthentication>
        <DemosApolloProvider>
          <UserProvider>
            <DemosRouter />
          </UserProvider>
        </DemosApolloProvider>
      </RequireAuthentication>
    </DemosAuthProvider>
  );
};
