import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, beforeEach, expect, it, vi } from "vitest";
import { DebugOnly } from "./DebugOnly";

vi.mock("config/env", () => ({
  isDevelopmentMode: vi.fn(),
}));

describe("DebugOnly", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders children when in development mode", async () => {
    const { isDevelopmentMode } = await import("config/env");
    vi.mocked(isDevelopmentMode).mockReturnValue(true);

    render(
      <DebugOnly>
        <span>Debug Content</span>
      </DebugOnly>
    );
    expect(screen.getByText("Debug Content")).toBeInTheDocument();
  });

  it("renders nothing when not in development mode", async () => {
    const { isDevelopmentMode } = await import("config/env");
    vi.mocked(isDevelopmentMode).mockReturnValue(false);

    const { container } = render(
      <DebugOnly>
        <span>Debug Content</span>
      </DebugOnly>
    );
    expect(container).toBeEmptyDOMElement();
  });
});
