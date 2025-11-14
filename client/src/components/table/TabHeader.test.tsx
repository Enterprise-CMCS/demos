import React from "react";
import { render, screen } from "@testing-library/react";

import { TabHeader } from "./TabHeader";

describe("TabHeader", () => {
  it("renders with title", () => {
    render(<TabHeader title="Test Title" />);

    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toHaveClass(
      "text-brand",
      "font-bold",
      "text-md",
      "uppercase",
      "tracking-wide"
    );
  });

  it("renders with children when provided", () => {
    render(
      <TabHeader title="Test Title">
        <button>Action Button</button>
      </TabHeader>
    );

    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Action Button")).toBeInTheDocument();
  });

  it("applies additional className when provided", () => {
    render(<TabHeader title="Test Title" className="custom-class" />);

    const container = screen.getByText("Test Title").closest("div");
    expect(container).toHaveClass("custom-class");
  });

  it("has correct styling structure", () => {
    render(<TabHeader title="Test Title" />);

    const container = screen.getByText("Test Title").closest("div");
    expect(container).toHaveClass(
      "flex",
      "justify-between",
      "items-center",
      "mb-md",
      "border-b",
      "border-gray-200",
      "pb-1"
    );
  });
});
