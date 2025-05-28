import React, { ReactNode } from "react";
import { useAuth } from "react-oidc-context";

const disableAuth = true;

const PrivateRoute = ({ children }: { children: ReactNode }) => {
  const auth = useAuth();

  if (disableAuth) {
    return <>{children}</>;
  }

  if (auth.isLoading) return <p>Loading...</p>;
  if (auth.error) return <p>Error: {auth.error.message}</p>;

  if (!auth.isAuthenticated) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl mb-4">You must be logged in to view this page.</h2>
        <p className="mt-4">
          <a
            href="/login"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Login
          </a>
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default PrivateRoute;
