// Import DOM testing library for Jest, to be used by all test files
import "@testing-library/jest-dom";
import React from "react";
import { vi } from "vitest";


vi.mock("react-oidc-context", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: true,
    user: { id_token: "fake-token" },
    signinRedirect: vi.fn(),
    signoutRedirect: vi.fn(),
    removeUser: vi.fn(),
  }),
}));
