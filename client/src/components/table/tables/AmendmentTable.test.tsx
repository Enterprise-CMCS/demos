import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AmendmentTable } from "./AmendmentTable";

const mockData = [
  {
    id: "1",
    title: "Amendment 1",
    status: "Draft",
    effectiveDate: "2025-01-01",
  },
];

describe("AmendmentTable", () => {
  it("renders without crashing and shows title", () => {
    render(<AmendmentTable data={mockData} demonstrationId="demo-123" />);
    expect(screen.getByText("Amendment 1")).toBeInTheDocument();
  });
});
