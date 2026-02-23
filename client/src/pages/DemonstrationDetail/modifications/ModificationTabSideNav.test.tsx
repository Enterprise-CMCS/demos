import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ModificationTabSideNav } from "./ModificationTabSideNav";
import { ModificationItem } from "./ModificationTabs";
import { DialogProvider } from "components/dialog/DialogContext";

describe("ModificationTabSideNav", () => {
  const mockModificationItem: ModificationItem = {
    id: "1",
    modificationType: "amendment",
    name: "Test Modification",
    description: "Test Description",
    status: "Pre-Submission",
    createdAt: new Date(0),
  };

  const expectedTabs = [
    { label: "Application", value: "application" },
    { label: "Details", value: "details" },
    { label: "Documents", value: "documents" },
  ];

  const setup = (modificationItem: ModificationItem) => {
    render(
      <DialogProvider>
        <ModificationTabSideNav modificationItem={modificationItem} />
      </DialogProvider>
    );
  };

  it("renders without crashing", () => {
    setup(mockModificationItem);
    expect(screen.getByText("Application")).toBeInTheDocument();
  });

  it("renders all tabs with correct labels and count", () => {
    setup(mockModificationItem);

    // Verify exact tab count to catch any added/removed tabs
    expectedTabs.forEach((tab) => {
      const tabElement = screen.getByTestId(`button-${tab.value}`);
      expect(tabElement).toBeInTheDocument();
      expect(tabElement).toHaveTextContent(tab.label);
    });

    // Verify no extra tabs exist
    const allTabButtons = screen
      .getAllByRole("button")
      .filter((button) => button.getAttribute("data-testid")?.startsWith("button-"));
    expect(allTabButtons).toHaveLength(expectedTabs.length);
  });

  it("has Application tab selected by default", () => {
    setup(mockModificationItem);

    expectedTabs.forEach((tab) => {
      const tabElement = screen.getByTestId(`button-${tab.value}`);
      expect(tabElement).toHaveAttribute(
        "aria-selected",
        tab.value === "application" ? "true" : "false"
      );
    });
  });

  it("switches tabs when clicked", () => {
    setup(mockModificationItem);

    const detailsTab = screen.getByTestId("button-details");
    fireEvent.click(detailsTab);

    expect(detailsTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("button-application")).toHaveAttribute("aria-selected", "false");
  });
});
