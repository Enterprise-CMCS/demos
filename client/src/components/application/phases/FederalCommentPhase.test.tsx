import "@testing-library/jest-dom";

import React from "react";
import { TestProvider } from "test-utils/TestProvider";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { FederalCommentPhase } from "./FederalCommentPhase";
import { TZDate } from "@date-fns/tz";
import { ApplicationWorkflowDocument } from "components/application";
import { DialogProvider } from "components/dialog/DialogContext";
import { EST_TIMEZONE } from "util/formatDate";
import { addDays } from "date-fns";

const FAKE_TODAY = new TZDate("2026-02-08", EST_TIMEZONE);

const DEFAULT_MOCK_DOCUMENT: ApplicationWorkflowDocument = {
  id: "doc-1",
  name: "Test Document",
  description: "Some test doc",
  documentType: "General File",
  phaseName: "Federal Comment",
  createdAt: new TZDate("2025-01-02", EST_TIMEZONE),
  owner: { person: { fullName: "Test User" } },
};

const DEFAULT_START_DATE = new TZDate("2025-01-01", EST_TIMEZONE);
const DEFAULT_END_DATE = addDays(FAKE_TODAY, 3);

const setup = (props = {}) =>
  render(
    <TestProvider>
      <DialogProvider>
        <FederalCommentPhase
          demonstrationId="demo-123"
          phaseStartDate={DEFAULT_START_DATE}
          phaseEndDate={DEFAULT_END_DATE}
          phaseComplete={false}
          initialDocuments={[]}
          {...props}
        />
      </DialogProvider>
    </TestProvider>
  );

describe("FederalCommentPhase", () => {
  vi.setSystemTime(FAKE_TODAY);

  describe("Warning Banner", () => {
    it("renders warning with days left", () => {
      setup();
      expect(screen.getByLabelText("Warning")).toBeInTheDocument();
      expect(screen.getByText(/days left/i, { exact: false })).toBeInTheDocument();
      expect(screen.getByText(/The Federal Comment Period ends on/i)).toBeInTheDocument();
    });

    it("uses correct singular/plural for day left", () => {
      setup({ phaseEndDate: new TZDate("2026-02-09", EST_TIMEZONE) });
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
      setup({ initialDocuments: [DEFAULT_MOCK_DOCUMENT] });
      expect(screen.getByText("Test Document")).toBeInTheDocument();
    });

    it("opens upload dialog when upload clicked", async () => {
      setup();
      const uploadButton = screen.getByRole("button", { name: /upload/i });
      await userEvent.click(uploadButton);

      // Dialog should appear in a <dialog> element
      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
      expect(dialog.tagName).toBe("DIALOG");

      expect(dialog).toHaveTextContent("Add Federal Comment Document");
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
    it("renders warning banner with correct days left and dismisses", async () => {
      setup({
        phaseStartDate: FAKE_TODAY,
        phaseEndDate: new TZDate("2026-02-13", EST_TIMEZONE), // 5 days after TODAY
      });

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
      setup({
        phaseStartDate: new TZDate("2026-01-01", EST_TIMEZONE),
        phaseEndDate: new TZDate("2026-02-05", EST_TIMEZONE), // 3 days before TODAY
      });

      expect(screen.getByText(/3 days past due/i)).toBeInTheDocument();
      expect(screen.getByText(/The Federal Comment Period ended on/i)).toBeInTheDocument();
    });

    it("does not render banner if phase is complete", () => {
      setup({
        phaseStartDate: FAKE_TODAY,
        phaseEndDate: new TZDate("2026-02-13", EST_TIMEZONE), // 5 days after TODAY
        phaseComplete: true,
      });

      expect(screen.queryByText(/days left/i)).not.toBeInTheDocument();
    });

    it("does not render banner if phaseEndDate is missing", () => {
      setup({
        phaseStartDate: FAKE_TODAY,
        phaseEndDate: undefined,
      });

      expect(screen.queryByText(/days left/i)).not.toBeInTheDocument();
    });
  });
});
