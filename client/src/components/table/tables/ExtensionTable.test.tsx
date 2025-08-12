import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ExtensionTable } from "./ExtensionTable";

const mockData = [
  {
    id: "1",
    title: "Extension 1",
    status: "Pending Review",
    effectiveDate: "2025-08-15",
  },
];

describe("ExtensionTable", () => {
  it("renders without crashing and shows title", () => {
    render(<ExtensionTable data={mockData} demonstrationId="demo-123" />);
    expect(screen.getByText("Extension 1")).toBeInTheDocument();
  });
});
