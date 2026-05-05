import React, { ReactNode } from "react";

import { ToastProvider } from "components/toast/ToastContext";

import { MockedProvider, MockedProviderProps } from "@apollo/client/testing";
import { MemoryRouter, MemoryRouterProps } from "react-router-dom";
import { ALL_MOCKS } from "mock-data";
import { CurrentUser, TestUserProvider } from "components/user/UserContext";
import { developmentMockUser } from "mock-data/userMocks";

interface TestProviderProps {
  children: ReactNode;
  mocks?: MockedProviderProps["mocks"];
  addTypename?: boolean;
  routerEntries?: MemoryRouterProps["initialEntries"];
  currentUser?: CurrentUser;
}

/**
 * A consolidated test provider that wraps commonly needed providers for testing.
 * This eliminates the need to manually wrap each test with multiple providers.
 *
 * @example
 * ```tsx
 * import { TestProvider } from "test-utils/TestProvider";
 *
 * // In your test file:
 * const setup = () => {
 *   return render(
 *     <TestProvider>
 *       <YourComponent />
 *     </TestProvider>
 *   );
 * };
 * ```
 */
export const TestProvider: React.FC<TestProviderProps> = ({
  children,
  mocks = ALL_MOCKS,
  addTypename = false,
  routerEntries = ["/"],
  currentUser = developmentMockUser,
}) => {
  return (
    <MemoryRouter initialEntries={routerEntries}>
      <ToastProvider>
        <MockedProvider mocks={mocks} addTypename={addTypename}>
          <TestUserProvider currentUser={currentUser}>
            {children}
          </TestUserProvider>
        </MockedProvider>
      </ToastProvider>
    </MemoryRouter>
  );
};
