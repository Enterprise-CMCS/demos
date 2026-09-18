import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { AuthContext, AuthContextProps } from "react-oidc-context";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { User } from "oidc-client-ts";
import { afterEach, expect, it, vi } from "vitest";
import { DemosLayoutProvider } from "./DemosLayoutProvider";
import { LOCAL_COGNITO_CONFIG } from "./cognitoConfig";

vi.unmock("react-oidc-context");
vi.mock("config/env", () => ({ shouldUseMocks: () => false }));
vi.mock("layout/PrimaryLayout", () => ({
  PrimaryLayout: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

afterEach(() => {
  window.history.replaceState({}, "", "/");
});

it("returns a logged-out email visitor to the linked route after login", async () => {
  const returnUrl = "/deliverables/deliverable-1?tab=documents#uploaded";
  window.history.replaceState({}, "", returnUrl);
  let savedState: unknown;
  const signinRedirect = vi.fn(async (args) => {
    savedState = args.state;
  });
  const auth = {
    isAuthenticated: false,
    isLoading: false,
    signinRedirect,
  } as unknown as AuthContextProps;
  const app = () => (
    <AuthContext.Provider value={auth}>
      <BrowserRouter>
        <Routes>
          <Route element={<DemosLayoutProvider header={() => null} />}>
            <Route
              path="/deliverables/:id"
              element={<div data-testid="linked-page">Deliverable</div>}
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
  const { unmount } = render(app());
  await waitFor(() => expect(signinRedirect).toHaveBeenCalledOnce());
  expect(savedState).toEqual({ returnUrl });
  expect(screen.queryByTestId("linked-page")).not.toBeInTheDocument();
  unmount();

  window.history.replaceState({}, "", "/?code=test-code&state=test-state");
  await LOCAL_COGNITO_CONFIG.onSigninCallback!(
    new User({
      access_token: "test-token",
      token_type: "Bearer",
      profile: { sub: "test-user", iss: "test", aud: "test", exp: 0, iat: 0 },
      userState: savedState,
    })
  );
  auth.isAuthenticated = true;
  render(app());
  expect(screen.getByTestId("linked-page")).toBeInTheDocument();
  expect(window.location.pathname + window.location.search + window.location.hash).toBe(returnUrl);
  expect(signinRedirect).toHaveBeenCalledOnce();
});
