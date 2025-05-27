import React from "react";
import { render } from "@testing-library/react";
import LandingPage from "./LandingPage";
import { describe, it, expect } from "vitest";

describe("LandingPage", () => {
  it("renders without crashing", () => {
    const { container } = render(<LandingPage />);
    expect(container).toBeInTheDocument();
  });
});
