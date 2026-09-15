import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ModificationDetailsSummary } from "./ModificationDetailsSummary";
import { ModificationItem } from "./ModificationTabs";
import { TestProvider } from "test-utils/TestProvider";
import { DEMONSTRATION_DETAIL_QUERY } from "../DemonstrationDetail";
import { cmsMockUser, readonlyMockUser } from "mock-data/userMocks";

const showUpdateAmendmentDialog = vi.fn();
const showUpdateRenewalDialog = vi.fn();

vi.mock("components/dialog/DialogContext", () => ({
  useDialog: () => ({
    showUpdateAmendmentDialog,
    showUpdateRenewalDialog,
  }),
}));

const renderModificationDetailsSummary = (
  modificationItem: ModificationItem,
  currentUser = cmsMockUser
) => {
  render(
    <TestProvider currentUser={currentUser}>
      <ModificationDetailsSummary modificationItem={modificationItem} />
    </TestProvider>
  );
};

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
    effectiveDate: new Date("2024-01-15T05:00:00.000Z"),
    signatureLevel: "OA",
    documents: [],
    medicaidId: "demo-1",
  };

  describe("Component Rendering", () => {
    it("renders the summary details header", () => {
      renderModificationDetailsSummary(mockAmendment);
      expect(screen.getByText("SUMMARY DETAILS")).toBeInTheDocument();
    });

    it("renders the modification name", () => {
      renderModificationDetailsSummary(mockAmendment);
      expect(screen.getByText("Amendment Title")).toBeInTheDocument();
      expect(screen.getByText("Test Modification")).toBeInTheDocument();
    });

    it("renders the correct title label ", () => {
      const mockRenewal: ModificationItem = {
        modificationType: "renewal",
        id: "mod-456",
        name: "Test Renewal",
        status: "Pre-Submission",
        documents: [],
        createdAt: new Date("2024-01-01"),
        medicaidId: "demo-2",
      };
      renderModificationDetailsSummary(mockRenewal);
      expect(screen.getByText("Renewal Title")).toBeInTheDocument();
      expect(screen.getByText("Test Renewal")).toBeInTheDocument();
    });

    it("renders the effective date when present", () => {
      renderModificationDetailsSummary(mockAmendment);
      expect(screen.getByText("Effective Date")).toBeInTheDocument();
      expect(screen.getByText("01/15/2024")).toBeInTheDocument();
    });

    it("renders the status", () => {
      renderModificationDetailsSummary(mockAmendment);
      expect(screen.getByText("Status")).toBeInTheDocument();
      expect(screen.getByText("Pre-Submission")).toBeInTheDocument();
    });

    it("renders the description when present", () => {
      renderModificationDetailsSummary(mockAmendment);
      expect(screen.getByText("Amendment Description")).toBeInTheDocument();
      expect(screen.getByText("This is a test modification description")).toBeInTheDocument();
    });

    it("renders the signature level when present", () => {
      renderModificationDetailsSummary(mockAmendment);
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
      renderModificationDetailsSummary(itemWithoutDescription);
      expect(screen.queryByText("Description")).not.toBeInTheDocument();
    });

    it("does not render description section when description is empty string", () => {
      const itemWithoutDescription: ModificationItem = {
        ...mockAmendment,
        description: "",
      };
      renderModificationDetailsSummary(itemWithoutDescription);
      expect(screen.queryByText("Description")).not.toBeInTheDocument();
    });

    it("displays placeholder when effective date is not provided", () => {
      const itemWithoutEffectiveDate: ModificationItem = {
        ...mockAmendment,
        effectiveDate: undefined,
      };
      renderModificationDetailsSummary(itemWithoutEffectiveDate);
      expect(screen.getByText("--/--/----")).toBeInTheDocument();
    });
  });

  describe("Complete Data Scenarios", () => {
    it("renders correctly with all optional fields present", () => {
      renderModificationDetailsSummary(mockAmendment);
      expect(screen.getByText("SUMMARY DETAILS")).toBeInTheDocument();
      expect(screen.getByText("Test Modification")).toBeInTheDocument();
      expect(screen.getByText("01/15/2024")).toBeInTheDocument();
      expect(screen.getByText("Pre-Submission")).toBeInTheDocument();
      expect(screen.getByText("This is a test modification description")).toBeInTheDocument();
      expect(screen.getByText("OA")).toBeInTheDocument();
    });

    it("renders correctly with minimal required fields only", () => {
      const renewal: ModificationItem = {
        modificationType: "renewal",
        id: "mod-minimal",
        medicaidId: "demo-2",
        name: "Minimal Modification",
        status: "On-hold",
        documents: [],
        createdAt: new Date("2024-01-01"),
      };
      renderModificationDetailsSummary(renewal);
      expect(screen.getByText("SUMMARY DETAILS")).toBeInTheDocument();
      expect(screen.getByText("Minimal Modification")).toBeInTheDocument();
      expect(screen.getByText("--/--/----")).toBeInTheDocument();
      expect(screen.getByText("On-hold")).toBeInTheDocument();
    });
  });

  describe("Edit Details Button", () => {
    const setup = (modificationItem: ModificationItem) => {
      renderModificationDetailsSummary(modificationItem);
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
      expect(showUpdateRenewalDialog).not.toHaveBeenCalled();
    });

    it("calls showUpdateRenewalDialog with correct ID when clicked for renewal", () => {
      const mockRenewal: ModificationItem = {
        modificationType: "renewal",
        id: "ext-456",
        medicaidId: "demo-2",
        name: "Test Renewal",
        status: "Pre-Submission",
        documents: [],
        createdAt: new Date("2024-01-01"),
      };
      setup(mockRenewal);
      const editButton = screen.getByRole("button", { name: /button-edit-details/i });

      fireEvent.click(editButton);

      expect(showUpdateRenewalDialog).toHaveBeenCalledWith("ext-456", [DEMONSTRATION_DETAIL_QUERY]);
      expect(showUpdateRenewalDialog).toHaveBeenCalledTimes(1);
      expect(showUpdateAmendmentDialog).not.toHaveBeenCalled();
    });
  });

  describe("Readonly User Behavior", () => {
    it("does not render the Edit Details button for readonly users", () => {
      renderModificationDetailsSummary(mockAmendment, readonlyMockUser);
      const editButton = screen.queryByRole("button", { name: /button-edit-details/i });
      expect(editButton).not.toBeInTheDocument();
    });
  });
});
