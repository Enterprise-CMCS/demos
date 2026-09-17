import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TypeTagManagement, DEMONSTRATION_TYPE_TAG_MANAGEMENT_NAME } from "./TypeTagManagement";

describe("TypeTagManagement", () => {
  it("renders without crashing", () => {
    render(<TypeTagManagement />);
    expect(screen.getByTestId(DEMONSTRATION_TYPE_TAG_MANAGEMENT_NAME)).toBeInTheDocument();
  });
});
