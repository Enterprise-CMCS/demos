// Import DOM testing library for Jest, to be used by all test files
import "@testing-library/jest-dom";

import { vi } from "vitest";

// Mock HTML dialog element for tests
Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
  value: vi.fn(),
  writable: true,
});

Object.defineProperty(HTMLDialogElement.prototype, "close", {
  value: vi.fn(),
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
