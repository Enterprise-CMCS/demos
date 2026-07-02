import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, it, expect, vi, Mock } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { DemosRoute } from "./DemosRouter";

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

vi.mock("config/env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("config/env")>();
  return {
    ...actual,
    isLocalDevelopment: vi.fn(() => false),
  };
});

vi.mock("layout/Layout", async () => {
  const React = (await import("react")).default;
  const { Outlet } = await import("react-router-dom");

  return {
    Layout: ({
      headerLower,
      sideNav,
      footer,
      children,
    }: {
      headerLower?: React.ReactNode;
      sideNav?: React.ReactNode;
      footer?: React.ReactNode;
      children?: React.ReactNode;
    }) => (
      <div>
        <div>Layout</div>
        {headerLower}
        {sideNav}
        {footer}
        {children ?? <Outlet />}
      </div>
    ),
  };
});

describe("DemosRoute", () => {
  beforeEach(async () => {
    currentUserState.currentUser.person.personType = "demos-cms-user";
    const envMod = await import("config/env");
    (envMod.isLocalDevelopment as unknown as Mock).mockReturnValue(false);
  });

  it("renders layout content for nested routes", () => {
    render(
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route
            element={
              <DemosRoute
                layout={{
                  headerLower: <div>HeaderLower</div>,
                  sideNav: <div>SideNav</div>,
                  footer: <div>Footer</div>,
                }}
              />
            }
          >
            <Route path="/protected" element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Layout")).toBeInTheDocument();
    expect(screen.getByText("HeaderLower")).toBeInTheDocument();
    expect(screen.getByText("SideNav")).toBeInTheDocument();
    expect(screen.getByText("Footer")).toBeInTheDocument();
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("renders direct children inside the layout", () => {
    render(
      <MemoryRouter>
        <DemosRoute layout={{ footer: <div>Footer</div> }}>
          <div>Direct Content</div>
        </DemosRoute>
      </MemoryRouter>
    );

    expect(screen.getByText("Layout")).toBeInTheDocument();
    expect(screen.getByText("Footer")).toBeInTheDocument();
    expect(screen.getByText("Direct Content")).toBeInTheDocument();
  });

  it("redirects disallowed users before rendering nested route content", () => {
    currentUserState.currentUser.person.personType = "demos-state-user";

    render(
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route path="/" element={<div>Home</div>} />
          <Route
            element={
              <DemosRoute requiredRoles={["demos-admin"]} layout={{ footer: <div>Footer</div> }} />
            }
          >
            <Route path="/protected" element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    expect(screen.queryByText("Layout")).not.toBeInTheDocument();
  });

  it("redirects debug-only routes outside local development", () => {
    render(
      <MemoryRouter initialEntries={["/debug"]}>
        <Routes>
          <Route path="/" element={<div>Home</div>} />
          <Route element={<DemosRoute debugOnly layout={{ footer: <div>Footer</div> }} />}>
            <Route path="/debug" element={<div>Debug Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.queryByText("Debug Content")).not.toBeInTheDocument();
    expect(screen.queryByText("Layout")).not.toBeInTheDocument();
  });

  it("renders debug-only routes in local development", async () => {
    const envMod = await import("config/env");
    (envMod.isLocalDevelopment as unknown as Mock).mockReturnValue(true);

    render(
      <MemoryRouter initialEntries={["/debug"]}>
        <Routes>
          <Route element={<DemosRoute debugOnly layout={{ footer: <div>Footer</div> }} />}>
            <Route path="/debug" element={<div>Debug Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Layout")).toBeInTheDocument();
    expect(screen.getByText("Footer")).toBeInTheDocument();
    expect(screen.getByText("Debug Content")).toBeInTheDocument();
  });
});
