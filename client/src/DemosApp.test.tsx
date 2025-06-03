import React from "react";
import { render } from "@testing-library/react";
import { DemosApp } from "./DemosApp";
import { describe, it, expect } from "vitest";

describe("DemosApp", () => {
  it("renders without crashing", () => {
    const { container } = render(<DemosApp />);
    expect(container).toBeInTheDocument();
  });
});
