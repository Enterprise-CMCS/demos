import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { RequireRole } from "./RequireRole";

const { currentUserState } = vi.hoisted(() => ({
  currentUserState: {
    currentUser: {
      id: "user-1",
      person: {
        personType: "demos-cms-user",
      },
    },
  },
}));

vi.mock("components/user/UserContext", () => ({
  getCurrentUser: () => ({
    currentUser: currentUserState.currentUser,
  }),
}));

describe("RequireRole", () => {
  const renderWithRouter = (ui: React.ReactNode, initialPath = "/") => {
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/" element={ui} />
          <Route path="/redirect" element={<div>Redirected</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it("renders children when user has an allowed role", () => {
    currentUserState.currentUser.person.personType = "demos-cms-user";

    renderWithRouter(
      <RequireRole allowedRoles={["demos-cms-user", "demos-admin"]}>
        <div>Protected Content</div>
      </RequireRole>
    );

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("renders children when user is admin and admin is allowed", () => {
    currentUserState.currentUser.person.personType = "demos-admin";

    renderWithRouter(
      <RequireRole allowedRoles={["demos-cms-user", "demos-admin"]}>
        <div>Protected Content</div>
      </RequireRole>
    );

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("redirects when user does not have an allowed role", () => {
    currentUserState.currentUser.person.personType = "demos-state-user";

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route
            path="/"
            element={
              <RequireRole allowedRoles={["demos-admin"]}>
                <div>Protected Content</div>
              </RequireRole>
            }
          />
          <Route path="/redirect" element={<div>Redirected</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Since Navigate goes to "/", we expect protected content NOT to render
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });
});
