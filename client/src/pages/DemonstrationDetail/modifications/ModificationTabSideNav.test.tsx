import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ModificationTabSideNav } from "./ModificationTabSideNav";
import { ModificationItem } from "./ModificationTabs";

describe("ModificationTabSideNav", () => {
  const mockModificationItem: ModificationItem = {
    id: "1",
    name: "Test Modification",
    description: "Test Description",
    status: "Active",
  };

  it("renders without crashing", () => {
    render(<ModificationTabSideNav modificationItem={mockModificationItem} />);
    expect(screen.getByText("Application")).toBeInTheDocument();
  });

  it("renders all tabs", () => {
    render(<ModificationTabSideNav modificationItem={mockModificationItem} />);

    expect(screen.getByText("Application")).toBeInTheDocument();
    expect(screen.getByText("Details")).toBeInTheDocument();
    expect(screen.getByText("Documents")).toBeInTheDocument();
  });

  it("has Application tab selected by default", () => {
    render(<ModificationTabSideNav modificationItem={mockModificationItem} />);

    const applicationTab = screen.getByTestId("button-application");
    const detailsTab = screen.getByTestId("button-details");
    const documentsTab = screen.getByTestId("button-documents");

    expect(applicationTab).toHaveAttribute("aria-selected", "true");
    expect(detailsTab).toHaveAttribute("aria-selected", "false");
    expect(documentsTab).toHaveAttribute("aria-selected", "false");
  });

  it("switches tabs when clicked", () => {
    render(<ModificationTabSideNav modificationItem={mockModificationItem} />);

    const detailsTab = screen.getByTestId("button-details");
    fireEvent.click(detailsTab);

    expect(detailsTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("button-application")).toHaveAttribute("aria-selected", "false");
  });
});
