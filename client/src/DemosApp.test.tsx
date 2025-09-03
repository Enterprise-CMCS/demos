import React from "react";
import { render } from "@testing-library/react";
import { DemosApp } from "./DemosApp";
import { describe, it, expect, vi } from "vitest";
import { act } from "react-dom/test-utils";

// Mock react-oidc-context with withAuthenticationRequired
vi.mock("react-oidc-context", async () => {
  const actual = await import("react-oidc-context");
  return {
    ...actual,
    withAuthenticationRequired: (Component: React.ComponentType, _options?: any) => Component,
  };
});

describe("DemosApp", () => {
  it("renders without crashing", async () => {
    let container: HTMLElement;
    await act(async () => {
      const result = render(<DemosApp />);
      container = result.container;
    });
    expect(container!).toBeInTheDocument();
  });
});
