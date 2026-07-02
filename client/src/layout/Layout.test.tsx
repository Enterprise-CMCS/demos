import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { Layout } from "./Layout";

vi.mock("components", () => ({
  Header: ({ headerLower }: { headerLower?: React.ReactNode }) => (
    <div>
      Header
      {headerLower}
    </div>
  ),
  ToastContainer: () => <div>ToastContainer</div>,
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("components/header/DefaultHeaderLower", () => ({
  DefaultHeaderLower: () => <div>DefaultHeaderLower</div>,
}));

vi.mock("components/dialog/DialogContext", () => ({
  DialogProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("Layout", () => {
  const renderLayout = (props?: React.ComponentProps<typeof Layout>) =>
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route element={<Layout {...props} />}>
            <Route path="/" element={<div>Child page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

  it("renders the header when shell chrome is provided", () => {
    renderLayout({ sideNav: <div>SideNav</div>, footer: <div>Footer</div> });

    expect(screen.getByText("Header")).toBeInTheDocument();
    expect(screen.getByText("SideNav")).toBeInTheDocument();
    expect(screen.getByText("Footer")).toBeInTheDocument();
  });

  it("renders the header when only a footer is provided", () => {
    renderLayout({ footer: <div>Footer</div> });

    expect(screen.getByText("Header")).toBeInTheDocument();
    expect(screen.queryByText("SideNav")).not.toBeInTheDocument();
    expect(screen.getByText("Footer")).toBeInTheDocument();
  });

  it("omits the header, side nav, and footer when shell chrome is not provided", () => {
    renderLayout();

    expect(screen.queryByText("Header")).not.toBeInTheDocument();
    expect(screen.queryByText("SideNav")).not.toBeInTheDocument();
    expect(screen.queryByText("Footer")).not.toBeInTheDocument();
  });

  it("renders explicit children when provided", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Layout footer={<div>Footer</div>}>
          <div>Child via props</div>
        </Layout>
      </MemoryRouter>
    );

    expect(screen.getByText("Child via props")).toBeInTheDocument();
    expect(screen.queryByText("Child page")).not.toBeInTheDocument();
  });
});
