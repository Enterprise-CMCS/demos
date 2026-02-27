import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ModificationTabSideNav } from "./ModificationTabSideNav";
import { ModificationItem } from "./ModificationTabs";
import { DialogProvider } from "components/dialog/DialogContext";

vi.mock("components/application", () => ({
  AmendmentWorkflow: () => <div data-testid="amendment-workflow">Amendment Workflow</div>,
  ExtensionWorkflow: () => <div data-testid="extension-workflow">Extension Workflow</div>,
}));

describe("ModificationTabSideNav", () => {
  const mockModificationItem: ModificationItem = {
    id: "1",
    modificationType: "amendment",
    name: "Test Modification",
    description: "Test Description",
    status: "Pre-Submission",
    createdAt: new Date(0),
    documents: [],
  };

  const expectedTabs = [
    { label: "Application", value: "application" },
    { label: "Details", value: "details" },
    { label: "Documents (0)", value: "documents" },
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

  describe("Application tab", () => {
    it("renders AmendmentWorkflow when modification type is amendment", () => {
      const amendmentModification: ModificationItem = {
        ...mockModificationItem,
        modificationType: "amendment",
      };
      setup(amendmentModification);

      expect(screen.getByTestId("amendment-workflow")).toBeInTheDocument();
      expect(screen.queryByTestId("extension-workflow")).not.toBeInTheDocument();
    });

    it("renders ExtensionWorkflow when modification type is extension", () => {
      const extensionModification: ModificationItem = {
        ...mockModificationItem,
        modificationType: "extension",
      };
      setup(extensionModification);

      expect(screen.getByTestId("extension-workflow")).toBeInTheDocument();
      expect(screen.queryByTestId("amendment-workflow")).not.toBeInTheDocument();
    });
  });

  describe("Documents tab", () => {
    it("displays correct document count in tab label", () => {
      const modificationWithDocs: ModificationItem = {
        ...mockModificationItem,
        documents: [{
          id: "doc1",
          name: "Document 1",
          documentType: "General File",
          description: "Test Document",
          createdAt: new Date(),
          owner: { person: { fullName: "Test User" } },
        }],
      };
      setup(modificationWithDocs);

      const documentsTab = screen.getByTestId("button-documents");
      expect(documentsTab).toHaveTextContent("Documents (1)");
    });

    it("render DocumentTable with correct props when Documents tab is selected", () => {
      const modificationWithDocs: ModificationItem = {
        ...mockModificationItem,
        documents: [{
          id: "doc1",
          name: "Document 1",
          documentType: "General File",
          description: "Test Document",
          createdAt: new Date(),
          owner: { person: { fullName: "Test User" } },
        }],
      };
      setup(modificationWithDocs);

      const documentsTab = screen.getByTestId("button-documents");
      fireEvent.click(documentsTab);

      expect(screen.getByText("Document 1")).toBeInTheDocument();
    });
  });
});
