import "@testing-library/jest-dom";

import React from "react";
import { TestProvider } from "test-utils/TestProvider";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { FederalCommentPhase } from "./FederalCommentPhase";
import { addDays } from "date-fns";
import { formatDate } from "util/formatDate";
import { ApplicationWorkflowDocument } from "../ApplicationWorkflow";

// Mock icons to avoid SVG rendering complexity
vi.mock("components/icons", async (importOriginal) => {
  const actual = await importOriginal<typeof import("components/icons")>();
  return {
    ...actual,
    WarningIcon: () => <div data-testid="warning-icon" />,
    ExitIcon: () => <div data-testid="exit-icon" />,
  };
});

const showFederalCommentDocumentUploadDialog = vi.fn();
vi.mock("components/dialog/DialogContext", () => ({
  useDialog: () => ({
    showFederalCommentDocumentUploadDialog,
  }),
}));

describe("FederalCommentPhase", () => {
  const defaultStart = new Date("2025-01-01");
  const defaultEnd = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days ahead

  const mockDoc: ApplicationWorkflowDocument = {
    id: "doc-1",
    name: "Test Document",
    description: "Some test doc",
    documentType: "General File",
    phaseName: "Federal Comment",
    createdAt: new Date("2025-01-02"),
    owner: { person: { fullName: "Test User" } },
  };

  const setup = (props = {}) =>
    render(
      <TestProvider>
        <FederalCommentPhase
          demonstrationId="demo-123"
          phaseStartDate={defaultStart}
          phaseEndDate={defaultEnd}
          phaseComplete={false}
          initialDocuments={[]}
          {...props}
        />
      </TestProvider>
    );

  describe("Warning Banner", () => {
    it("renders warning with days left", () => {
      setup();
      expect(screen.getByTestId("warning-icon")).toBeInTheDocument();
      expect(screen.getByText(/days left/i, { exact: false })).toBeInTheDocument();
      expect(screen.getByText(/The Federal Comment Period ends on/i)).toBeInTheDocument();
    });

    it("uses correct singular/plural for day left", () => {
      const oneDayEnd = formatDate(addDays(new Date(), 1));

      setup({ phaseEndDate: oneDayEnd });
      expect(screen.getByText(/1 day left/i)).toBeInTheDocument();
    });
  });

  describe("Header and Description", () => {
    it("renders header", () => {
      setup();
      const header = screen.getByText("FEDERAL COMMENT PERIOD");
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass("text-brand");
    });

    it("renders description with Medicaid.gov link", () => {
      setup();
      const link = screen.getByRole("link", { name: "Medicaid.gov" });
      expect(link).toHaveAttribute("href", "https://www.medicaid.gov");
    });
  });

  describe("Step 1 - Upload Section", () => {
    it("renders upload section with title and helper text", () => {
      setup();
      expect(screen.getByText("STEP 2 - UPLOAD")).toBeInTheDocument();
      expect(screen.getByText(/Upload the Internal Analysis Document/)).toBeInTheDocument();
    });

    it("shows 'No documents yet' when no documents", () => {
      setup();
      expect(screen.getByText("No documents yet.")).toBeInTheDocument();
    });

    it("renders document row when provided", () => {
      setup({ initialDocuments: [mockDoc] });
      expect(screen.getByText("Test Document")).toBeInTheDocument();
    });

    it("opens upload dialog when upload clicked", async () => {
      setup();
      const uploadButton = screen.getByRole("button", { name: /upload/i });
      await userEvent.click(uploadButton);
      expect(showFederalCommentDocumentUploadDialog).toHaveBeenCalledWith("demo-123");
    });
  });

  describe("Step 2 - Verify/Complete Section", () => {
    it("renders step 2 title and description", () => {
      setup();
      expect(screen.getByText("STEP 1 - VERIFY/COMPLETE")).toBeInTheDocument();
      expect(
        screen.getByText(/The Federal Comment phase automatically completes after/i)
      ).toBeInTheDocument();
    });

    it("shows formatted start and end dates", () => {
      setup();
      expect(screen.getByText(/Federal Comment Period Start Date/i)).toBeInTheDocument();
      expect(screen.getByText(/Federal Comment Period End Date/i)).toBeInTheDocument();
    });
  });

  describe("FederalCommentPhase Notice Banner", () => {
    const today = new Date("2026-02-08T00:00:00Z");
    vi.setSystemTime(today);

    it("renders warning banner with correct days left and dismisses", async () => {
      const futureEnd = addDays(new Date(today), 5);

      render(
        <TestProvider>
          <FederalCommentPhase
            demonstrationId="demo-123"
            phaseStartDate={today}
            phaseEndDate={futureEnd}
            phaseComplete={false}
          />
        </TestProvider>
      );

      const title = screen.getByText(/5 days left in Federal Comment Period/i);
      const description = screen.getByText(/The Federal Comment Period ends on/i);

      expect(title).toBeInTheDocument();
      expect(description).toBeInTheDocument();

      // Dismiss the banner
      const dismissButton = screen.getByRole("button", { name: /dismiss/i });
      await userEvent.click(dismissButton);

      expect(screen.queryByText(/5 days left/i)).not.toBeInTheDocument();
    });

    it("renders past-due banner correctly", () => {
      const pastEnd = addDays(new Date(today), -3);

      render(
        <TestProvider>
          <FederalCommentPhase
            demonstrationId="demo-123"
            phaseStartDate={new Date("2026-01-01")}
            phaseEndDate={pastEnd}
            phaseComplete={false}
          />
        </TestProvider>
      );

      expect(screen.getByText(/3 days past due/i)).toBeInTheDocument();
      expect(screen.getByText(/The Federal Comment Period ended on/i)).toBeInTheDocument();
    });

    it("does not render banner if phase is complete", () => {
      const futureEnd = addDays(new Date(today), 5);

      render(
        <TestProvider>
          <FederalCommentPhase
            demonstrationId="demo-123"
            phaseStartDate={today}
            phaseEndDate={futureEnd}
            phaseComplete={true}
          />
        </TestProvider>
      );

      expect(screen.queryByText(/days left/i)).not.toBeInTheDocument();
    });

    it("does not render banner if phaseEndDate is missing", () => {
      render(
        <TestProvider>
          <FederalCommentPhase
            demonstrationId="demo-123"
            phaseStartDate={today}
            phaseEndDate={undefined}
            phaseComplete={false}
          />
        </TestProvider>
      );

      expect(screen.queryByText(/days left/i)).not.toBeInTheDocument();
    });
  });
});
