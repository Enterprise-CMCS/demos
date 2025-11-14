import React, { ReactNode } from "react";

import { ToastProvider } from "components/toast/ToastContext";

import { MockedProvider, MockedProviderProps } from "@apollo/client/testing";
import { MemoryRouter, MemoryRouterProps } from "react-router-dom";

interface TestProviderProps {
  children: ReactNode;
  mocks?: MockedProviderProps["mocks"];
  addTypename?: boolean;
  routerEntries?: MemoryRouterProps["initialEntries"];
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
  mocks = [],
  addTypename = false,
  routerEntries = ["/"],
}) => {
  return (
    <MemoryRouter initialEntries={routerEntries}>
      <ToastProvider>
        <MockedProvider mocks={mocks} addTypename={addTypename}>
          {children}
        </MockedProvider>
      </ToastProvider>
    </MemoryRouter>
  );
};
