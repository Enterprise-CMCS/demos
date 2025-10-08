import React from "react";
import { render, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DemosApp } from "./DemosApp";

describe("DemosApp", () => {
  it("renders without crashing", async () => {
    const { container } = render(<DemosApp />);

    await waitFor(() => {
      expect(container).toBeInTheDocument();
    });
  });
});
