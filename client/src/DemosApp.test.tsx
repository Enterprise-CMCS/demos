import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DemosApp } from "./DemosApp";

vi.mock("router/DemosBootstrap", () => ({
  DemosBootstrap: () => <div data-testid="demos-bootstrap">bootstrap content</div>,
}));

describe("DemosApp", () => {
  it("renders DemosBootstrap", () => {
    render(<DemosApp />);

    expect(screen.getByTestId("demos-bootstrap")).toHaveTextContent("bootstrap content");
  });
});
