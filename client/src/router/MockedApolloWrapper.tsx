import React from "react";
import { MockedProvider } from "@apollo/client/testing";
import { ALL_MOCKS } from "mock-data";

export const MockedApolloWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (import.meta.env.PROD) {
    throw new Error("MockedApolloWrapper must not be used in production builds");
  }
  return (
    <MockedProvider mocks={ALL_MOCKS} addTypename={false}>
      {children}
    </MockedProvider>
  );
};
