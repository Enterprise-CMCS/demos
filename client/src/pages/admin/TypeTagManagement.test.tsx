import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TypeTagManagement } from "./TypeTagManagement";

describe("TypeTagManagement", () => {
  it("renders without crashing", () => {
    render(<TypeTagManagement />);
    expect(screen.getByText("Type/Tag Management")).toBeInTheDocument();
  });
});
