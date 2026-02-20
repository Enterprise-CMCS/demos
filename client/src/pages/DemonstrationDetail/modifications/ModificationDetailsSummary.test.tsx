import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ModificationDetailsSummary } from "./ModificationDetailsSummary";
import { ModificationItem } from "./ModificationTabs";
import { TestProvider } from "test-utils/TestProvider";
import { DEMONSTRATION_DETAIL_QUERY } from "../DemonstrationDetail";

const showUpdateAmendmentDialog = vi.fn();
const showUpdateExtensionDialog = vi.fn();

vi.mock("components/dialog/DialogContext", () => ({
  useDialog: () => ({
    showUpdateAmendmentDialog,
    showUpdateExtensionDialog,
  }),
}));

describe("ModificationDetailsSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAmendment: ModificationItem = {
    modificationType: "amendment",
    id: "mod-123",
    name: "Test Modification",
    description: "This is a test modification description",
    status: "Pre-Submission",
    createdAt: new Date("2024-01-01"),
    effectiveDate: new Date("2024-01-15"),
    signatureLevel: "OA",
  };

  describe("Component Rendering", () => {
    it("renders the summary details header", () => {
      render(<ModificationDetailsSummary modificationItem={mockAmendment} />);
      expect(screen.getByText("SUMMARY DETAILS")).toBeInTheDocument();
    });

    it("renders the modification name", () => {
      render(<ModificationDetailsSummary modificationItem={mockAmendment} />);
      expect(screen.getByText("Amendment Title")).toBeInTheDocument();
      expect(screen.getByText("Test Modification")).toBeInTheDocument();
    });

    it("renders the correct title label ", () => {
      const mockExtension: ModificationItem = {
        modificationType: "extension",
        id: "mod-456",
        name: "Test Extension",
        status: "Pre-Submission",
        createdAt: new Date("2024-01-01"),
      };
      render(<ModificationDetailsSummary modificationItem={mockExtension} />);
      expect(screen.getByText("Extension Title")).toBeInTheDocument();
      expect(screen.getByText("Test Extension")).toBeInTheDocument();
    });

    it("renders the effective date when present", () => {
      render(<ModificationDetailsSummary modificationItem={mockAmendment} />);
      expect(screen.getByText("Effective Date")).toBeInTheDocument();
      expect(screen.getByText("01/15/2024")).toBeInTheDocument();
    });

    it("renders the status", () => {
      render(<ModificationDetailsSummary modificationItem={mockAmendment} />);
      expect(screen.getByText("Status")).toBeInTheDocument();
      expect(screen.getByText("Pre-Submission")).toBeInTheDocument();
    });

    it("renders the description when present", () => {
      render(<ModificationDetailsSummary modificationItem={mockAmendment} />);
      expect(screen.getByText("Amendment Description")).toBeInTheDocument();
      expect(screen.getByText("This is a test modification description")).toBeInTheDocument();
    });

    it("renders the signature level when present", () => {
      render(<ModificationDetailsSummary modificationItem={mockAmendment} />);
      expect(screen.getByText("Signature Level")).toBeInTheDocument();
      expect(screen.getByText("OA")).toBeInTheDocument();
    });
  });

  describe("Conditional Rendering", () => {
    it("does not render description section when description is not provided", () => {
      const itemWithoutDescription: ModificationItem = {
        ...mockAmendment,
        description: undefined,
      };
      render(<ModificationDetailsSummary modificationItem={itemWithoutDescription} />);
      expect(screen.queryByText("Description")).not.toBeInTheDocument();
    });

    it("does not render description section when description is empty string", () => {
      const itemWithoutDescription: ModificationItem = {
        ...mockAmendment,
        description: "",
      };
      render(<ModificationDetailsSummary modificationItem={itemWithoutDescription} />);
      expect(screen.queryByText("Description")).not.toBeInTheDocument();
    });

    it("does not render signature level section when signature level is not provided", () => {
      const itemWithoutSignatureLevel: ModificationItem = {
        ...mockAmendment,
        signatureLevel: undefined,
      };
      render(<ModificationDetailsSummary modificationItem={itemWithoutSignatureLevel} />);
      expect(screen.queryByText("Signature Level")).not.toBeInTheDocument();
    });

    it("displays placeholder when effective date is not provided", () => {
      const itemWithoutEffectiveDate: ModificationItem = {
        ...mockAmendment,
        effectiveDate: undefined,
      };
      render(<ModificationDetailsSummary modificationItem={itemWithoutEffectiveDate} />);
      expect(screen.getByText("--/--/----")).toBeInTheDocument();
    });
  });

  describe("Complete Data Scenarios", () => {
    it("renders correctly with all optional fields present", () => {
      render(<ModificationDetailsSummary modificationItem={mockAmendment} />);
      expect(screen.getByText("SUMMARY DETAILS")).toBeInTheDocument();
      expect(screen.getByText("Test Modification")).toBeInTheDocument();
      expect(screen.getByText("01/15/2024")).toBeInTheDocument();
      expect(screen.getByText("Pre-Submission")).toBeInTheDocument();
      expect(screen.getByText("This is a test modification description")).toBeInTheDocument();
      expect(screen.getByText("OA")).toBeInTheDocument();
    });

    it("renders correctly with minimal required fields only", () => {
      const extension: ModificationItem = {
        modificationType: "extension",
        id: "mod-minimal",
        name: "Minimal Modification",
        status: "On-hold",
        createdAt: new Date("2024-01-01"),
      };
      render(<ModificationDetailsSummary modificationItem={extension} />);
      expect(screen.getByText("SUMMARY DETAILS")).toBeInTheDocument();
      expect(screen.getByText("Minimal Modification")).toBeInTheDocument();
      expect(screen.getByText("--/--/----")).toBeInTheDocument();
      expect(screen.getByText("On-hold")).toBeInTheDocument();
      expect(screen.queryByText("Description")).not.toBeInTheDocument();
      expect(screen.queryByText("Signature Level")).not.toBeInTheDocument();
    });
  });

  describe("Edit Details Button", () => {
    const setup = (modificationItem: ModificationItem) => {
      render(
        <TestProvider>
          <ModificationDetailsSummary modificationItem={modificationItem} />
        </TestProvider>
      );
    };

    it("renders the Edit Details button", () => {
      setup(mockAmendment);
      const editButton = screen.getByRole("button", { name: /button-edit-details/i });
      expect(editButton).toBeInTheDocument();
      expect(editButton).toHaveTextContent("Edit Details");
    });

    it("calls showUpdateAmendmentDialog with correct ID when clicked for amendment", () => {
      setup(mockAmendment);
      const editButton = screen.getByRole("button", { name: /button-edit-details/i });

      fireEvent.click(editButton);

      expect(showUpdateAmendmentDialog).toHaveBeenCalledWith("mod-123", [
        DEMONSTRATION_DETAIL_QUERY,
      ]);
      expect(showUpdateAmendmentDialog).toHaveBeenCalledTimes(1);
      expect(showUpdateExtensionDialog).not.toHaveBeenCalled();
    });

    it("calls showUpdateExtensionDialog with correct ID when clicked for extension", () => {
      const mockExtension: ModificationItem = {
        modificationType: "extension",
        id: "ext-456",
        name: "Test Extension",
        status: "Pre-Submission",
        createdAt: new Date("2024-01-01"),
      };
      setup(mockExtension);
      const editButton = screen.getByRole("button", { name: /button-edit-details/i });

      fireEvent.click(editButton);

      expect(showUpdateExtensionDialog).toHaveBeenCalledWith("ext-456", [
        DEMONSTRATION_DETAIL_QUERY,
      ]);
      expect(showUpdateExtensionDialog).toHaveBeenCalledTimes(1);
      expect(showUpdateAmendmentDialog).not.toHaveBeenCalled();
    });
  });
});
