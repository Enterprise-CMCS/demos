import React from "react";
import type { IIdleTimerProps } from "react-idle-timer";
import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import { IdleSessionHandler } from "./IdleSessionHandler";

// Mock useAuthActions
const mockSignOut = vi.fn();
vi.mock("components/auth/AuthActions", () => ({
  useAuthActions: () => ({
    signOut: mockSignOut,
  }),
}));

// Mock useIdleTimer
const mockUseIdleTimer = vi.fn();
vi.mock("react-idle-timer", () => ({
  useIdleTimer: (config: IIdleTimerProps) => mockUseIdleTimer(config),
}));

describe("IdleSessionHandler", () => {
  beforeEach(() => {
    (import.meta as any).env.VITE_IDLE_TIMEOUT = undefined;
    mockUseIdleTimer.mockClear();
    mockSignOut.mockClear();
  });

  it("initializes the idle timer with correct config", () => {
    render(<IdleSessionHandler />);

    expect(mockUseIdleTimer).toHaveBeenCalledWith({
      timeout: 15 * 60 * 1000,
      onIdle: expect.any(Function),
      debounce: 500,
    });
  });

  it("calls signOut when idle", () => {
    // Capture the onIdle callback from the config
    let onIdleCallback: () => void = () => {};
    mockUseIdleTimer.mockImplementation((config) => {
      onIdleCallback = config.onIdle;
    });

    render(<IdleSessionHandler />);
    onIdleCallback();

    expect(mockSignOut).toHaveBeenCalled();
  });

  it("does not initialize the idle timer when disabled (-1)", () => {
    (import.meta as any).env.VITE_IDLE_TIMEOUT = "-1";

    render(<IdleSessionHandler />);

    expect(mockUseIdleTimer).not.toHaveBeenCalled();
  });
});
