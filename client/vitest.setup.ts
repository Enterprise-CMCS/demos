// Import DOM testing library for Jest, to be used by all test files
import "@testing-library/jest-dom";

import React from "react";

import { vi } from "vitest";

// Mock HTML dialog element for tests
// HTMLDialogElement API is not fully supported in jsdom yet, so we need these mocks
Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
  value: vi.fn(function (this: HTMLDialogElement) {
    this.open = true;
  }),
  writable: true,
});

Object.defineProperty(HTMLDialogElement.prototype, "show", {
  value: vi.fn(function (this: HTMLDialogElement) {
    this.open = true;
  }),
  writable: true,
});

Object.defineProperty(HTMLDialogElement.prototype, "close", {
  value: vi.fn(function (this: HTMLDialogElement) {
    this.open = false;
  }),
  writable: true,
});

Object.defineProperty(HTMLDialogElement.prototype, "open", {
  get() {
    return this.hasAttribute("open");
  },
  set(val) {
    if (val) {
      this.setAttribute("open", "");
    } else {
      this.removeAttribute("open");
    }
  },
});

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
