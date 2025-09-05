// IdleSessionHandler.test.tsx
import React from "react";
import type { IIdleTimerProps } from "react-idle-timer";
import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// --- mocks before SUT import ---
const mockSignOut = vi.fn();
vi.mock("components/auth/AuthActions", () => ({
  useAuthActions: () => ({ signOut: mockSignOut }),
}));

const mockUseIdleTimer = vi.fn();
vi.mock("react-idle-timer", () => ({
  useIdleTimer: (cfg: IIdleTimerProps) => mockUseIdleTimer(cfg),
}));

const getIdleTimeoutMsMock = vi.fn<number, []>();
vi.mock("config/env", () => ({
  // isLocalDevelopment no longer matters for disabling
  getIdleTimeoutMs: () => getIdleTimeoutMsMock(),
}));

async function renderSut() {
  const mod = await import("./IdleSessionHandler");
  return render(<mod.IdleSessionHandler />);
}

beforeEach(() => {
  mockSignOut.mockReset();
  mockUseIdleTimer.mockReset();
  getIdleTimeoutMsMock.mockReset();
});

describe("IdleSessionHandler", () => {
  it("initializes the idle timer with default 15min when env not set", async () => {
    getIdleTimeoutMsMock.mockReturnValue(15 * 60 * 1000);

    await renderSut();

    expect(mockUseIdleTimer).toHaveBeenCalledWith({
      timeout: 15 * 60 * 1000,
      onIdle: expect.any(Function),
      debounce: 500,
    });
  });

  it("calls signOut when idle", async () => {
    let onIdle: () => void = () => {};
    mockUseIdleTimer.mockImplementation((cfg: IIdleTimerProps) => {
      onIdle = cfg.onIdle!;
    });
    getIdleTimeoutMsMock.mockReturnValue(1000);

    await renderSut();
    onIdle();

    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it("does not initialize the idle timer when disabled (-1)", async () => {
    getIdleTimeoutMsMock.mockReturnValue(-1);

    await renderSut();

    expect(mockUseIdleTimer).not.toHaveBeenCalled();
  });

  it("does not initialize the idle timer when 0 or invalid", async () => {
    getIdleTimeoutMsMock.mockReturnValue(0);
    await renderSut();
    expect(mockUseIdleTimer).not.toHaveBeenCalled();

    mockUseIdleTimer.mockReset();
    // simulate NaN/invalid
    getIdleTimeoutMsMock.mockReturnValueOnce(Number.NaN);
    await renderSut();
    expect(mockUseIdleTimer).not.toHaveBeenCalled();
  });
});
