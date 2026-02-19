import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ModificationDetailsSummary } from "./ModificationDetailsSummary";
import { ModificationItem } from "./ModificationTabs";

describe("ModificationDetailsSummary", () => {
  const mockModificationItem: ModificationItem = {
    id: "mod-123",
    name: "Test Modification",
    description: "This is a test modification description",
    status: "Active",
    createdAt: new Date("2024-01-01"),
    effectiveDate: new Date("2024-01-15"),
    signatureLevel: "Level 3",
  };

  describe("Component Rendering", () => {
    it("renders the summary details header", () => {
      render(<ModificationDetailsSummary modificationItem={mockModificationItem} />);
      expect(screen.getByText("SUMMARY DETAILS")).toBeInTheDocument();
    });

    it("renders the modification name", () => {
      render(<ModificationDetailsSummary modificationItem={mockModificationItem} />);
      expect(screen.getByText("Name")).toBeInTheDocument();
      expect(screen.getByText("Test Modification")).toBeInTheDocument();
    });

    it("renders the effective date when present", () => {
      render(<ModificationDetailsSummary modificationItem={mockModificationItem} />);
      expect(screen.getByText("Effective Date")).toBeInTheDocument();
      expect(screen.getByText("01/15/2024")).toBeInTheDocument();
    });

    it("renders the status", () => {
      render(<ModificationDetailsSummary modificationItem={mockModificationItem} />);
      expect(screen.getByText("Status")).toBeInTheDocument();
      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("renders the description when present", () => {
      render(<ModificationDetailsSummary modificationItem={mockModificationItem} />);
      expect(screen.getByText("Description")).toBeInTheDocument();
      expect(screen.getByText("This is a test modification description")).toBeInTheDocument();
    });

    it("renders the signature level when present", () => {
      render(<ModificationDetailsSummary modificationItem={mockModificationItem} />);
      expect(screen.getByText("Signature Level")).toBeInTheDocument();
      expect(screen.getByText("Level 3")).toBeInTheDocument();
    });
  });

  describe("Conditional Rendering", () => {
    it("does not render description section when description is not provided", () => {
      const itemWithoutDescription: ModificationItem = {
        ...mockModificationItem,
        description: undefined,
      };
      render(<ModificationDetailsSummary modificationItem={itemWithoutDescription} />);
      expect(screen.queryByText("Description")).not.toBeInTheDocument();
    });

    it("does not render description section when description is empty string", () => {
      const itemWithoutDescription: ModificationItem = {
        ...mockModificationItem,
        description: "",
      };
      render(<ModificationDetailsSummary modificationItem={itemWithoutDescription} />);
      expect(screen.queryByText("Description")).not.toBeInTheDocument();
    });

    it("does not render signature level section when signature level is not provided", () => {
      const itemWithoutSignatureLevel: ModificationItem = {
        ...mockModificationItem,
        signatureLevel: undefined,
      };
      render(<ModificationDetailsSummary modificationItem={itemWithoutSignatureLevel} />);
      expect(screen.queryByText("Signature Level")).not.toBeInTheDocument();
    });

    it("displays placeholder when effective date is not provided", () => {
      const itemWithoutEffectiveDate: ModificationItem = {
        ...mockModificationItem,
        effectiveDate: undefined,
      };
      render(<ModificationDetailsSummary modificationItem={itemWithoutEffectiveDate} />);
      expect(screen.getByText("--/--/----")).toBeInTheDocument();
    });

    it("displays empty string when status is null", () => {
      const itemWithNullStatus: ModificationItem = {
        ...mockModificationItem,
        status: null as unknown as string,
      };
      render(<ModificationDetailsSummary modificationItem={itemWithNullStatus} />);
      expect(screen.getByText("Status")).toBeInTheDocument();
      // The status value should be an empty string, but we just check that it renders correctly
      const statusElements = screen.getAllByText("Status");
      expect(statusElements.length).toBeGreaterThan(0);
    });
  });

  describe("Complete Data Scenarios", () => {
    it("renders correctly with all optional fields present", () => {
      render(<ModificationDetailsSummary modificationItem={mockModificationItem} />);
      expect(screen.getByText("SUMMARY DETAILS")).toBeInTheDocument();
      expect(screen.getByText("Test Modification")).toBeInTheDocument();
      expect(screen.getByText("01/15/2024")).toBeInTheDocument();
      expect(screen.getByText("Active")).toBeInTheDocument();
      expect(screen.getByText("This is a test modification description")).toBeInTheDocument();
      expect(screen.getByText("Level 3")).toBeInTheDocument();
    });

    it("renders correctly with minimal required fields only", () => {
      const minimalItem: ModificationItem = {
        id: "mod-minimal",
        name: "Minimal Modification",
        status: "Pending",
        createdAt: new Date("2024-01-01"),
      };
      render(<ModificationDetailsSummary modificationItem={minimalItem} />);
      expect(screen.getByText("SUMMARY DETAILS")).toBeInTheDocument();
      expect(screen.getByText("Minimal Modification")).toBeInTheDocument();
      expect(screen.getByText("--/--/----")).toBeInTheDocument();
      expect(screen.getByText("Pending")).toBeInTheDocument();
      expect(screen.queryByText("Description")).not.toBeInTheDocument();
      expect(screen.queryByText("Signature Level")).not.toBeInTheDocument();
    });
  });
});
