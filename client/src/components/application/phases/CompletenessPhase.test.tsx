import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { TestProvider } from "test-utils/TestProvider";

import {
  CompletenessPhase,
  CompletenessPhaseProps,
} from "./CompletenessPhase";

import { ApplicationWorkflowDocument } from "../ApplicationWorkflow";

const showCompletenessDocumentUploadDialog = vi.fn();
const showDeclareIncompleteDialog = vi.fn();

vi.mock("components/dialog/DialogContext", () => ({
  useDialog: () => ({
    showCompletenessDocumentUploadDialog,
    showDeclareIncompleteDialog,
  }),
}));

vi.mock("components/application/date/dateQueries", () => ({
  useSetApplicationDates: () => ({
    setApplicationDates: vi.fn(() => Promise.resolve()),
  }),
}));

vi.mock("../phase-status/phaseStatusQueries", () => ({
  useSetPhaseStatus: vi.fn(() => ({
    setPhaseStatus: vi.fn(() => Promise.resolve()),
  })),
}));

const mockCompletenessDoc: ApplicationWorkflowDocument = {
  id: "doc-1",
  name: "Completeness Letter",
  description: "Test letter",
  documentType: "Application Completeness Letter",
  phaseName: "Completeness",
  owner: { person: { fullName: "Jane Doe" } },
  createdAt: new Date("2026-02-01"),
};

const mockInternalDoc: ApplicationWorkflowDocument = {
  id: "doc-2",
  name: "Internal Form",
  description: "Internal form",
  documentType: "Internal Completeness Review Form",
  phaseName: "Completeness",
  owner: { person: { fullName: "John Smith" } },
  createdAt: new Date("2026-02-02"),
};

describe("CompletenessPhase", () => {
  const defaultProps: CompletenessPhaseProps = {
    applicationId: "app-123",
    applicationIntakeComplete: true,
    completenessComplete: false,
    completenessReviewDate: "2026-02-28",
    fedCommentStartDate: "",
    fedCommentEndDate: "",
    stateDeemedCompleteDate: "",
    initialDocuments: [],
  };

  const setup = (props: Partial<CompletenessPhaseProps> = {}) => {
    const finalProps = { ...defaultProps, ...props };
    render(
      <TestProvider>
        <CompletenessPhase {...finalProps} />
      </TestProvider>
    );
    return finalProps;
  };

  describe("Phase Header", () => {
    it("renders COMPLETENESS header", () => {
      setup();
      const header = screen.getByText("COMPLETENESS");
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass("text-brand");
    });
  });

  describe("Step 1 - Upload Section", () => {
    it("renders upload button and helper text", () => {
      setup();
      expect(screen.getByText("STEP 1 - UPLOAD")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /upload/i })).toBeInTheDocument();
    });

    it("renders uploaded documents", () => {
      setup({ initialDocuments: [mockCompletenessDoc, mockInternalDoc] });
      expect(screen.getByText("Completeness Letter")).toBeInTheDocument();
      expect(screen.getByText("Internal Form")).toBeInTheDocument();
    });
  });

  describe("Step 2 - Verify/Complete Section", () => {
    it("renders date picker for State Application Deemed Complete", () => {
      setup();
      const dateInput = screen.getByLabelText(/State Application Deemed Complete/);
      expect(dateInput).toBeInTheDocument();
      expect(dateInput).toHaveAttribute("type", "date");
    });

    it("renders disabled date pickers for Federal Comment Period", () => {
      setup();
      const startInput = screen.getByLabelText(/Federal Comment Period Start Date/);
      const endInput = screen.getByLabelText(/Federal Comment Period End Date/);
      expect(startInput).toBeDisabled();
      expect(endInput).toBeDisabled();
    });
  });

  describe("Button Logic", () => {
    it("Finish button is disabled if required docs are missing", () => {
      setup({ initialDocuments: [] });
      const finishButton = screen.getByRole("button", { name: /finish/i });
      expect(finishButton).toBeDisabled();
    });

    it("Finish button is enabled when required docs and dates exist", () => {
      setup({
        initialDocuments: [mockCompletenessDoc, mockInternalDoc],
        stateDeemedCompleteDate: "2026-02-05",
        fedCommentStartDate: "2026-02-06",
        fedCommentEndDate: "2026-03-07",
      });
      const finishButton = screen.getByRole("button", { name: /finish/i });
      expect(finishButton).toBeEnabled();
    });
  });

  describe("Upload Modal", () => {
    it("calls dialog function when upload clicked", async () => {
      setup();

      const uploadButton = screen.getByRole("button", { name: /upload/i });
      await userEvent.click(uploadButton);

      expect(showCompletenessDocumentUploadDialog).toHaveBeenCalledWith(
        "app-123",
        expect.any(Function)
      );
    });
  });

  describe("Completeness Notice Banner", () => {
    it("renders the banner with correct content and dismisses on click", async () => {
      const today = new Date("2026-02-08T00:00:00Z");
      vi.setSystemTime(today);

      const reviewDate = "2026-02-10"; // 2 days from today

      render(
        <TestProvider>
          <CompletenessPhase
            applicationId="app-123"
            applicationIntakeComplete={true}
            completenessReviewDate={reviewDate}
            fedCommentStartDate=""
            fedCommentEndDate=""
            completenessComplete={false}
            stateDeemedCompleteDate=""
            initialDocuments={[]}
          />
        </TestProvider>
      );

      // banner shows 2 days left
      const title = screen.getByText("2 days left");
      const description = screen.getByText(
        /This Demonstration must be declared complete by/
      );
      expect(title).toBeInTheDocument();
      expect(description).toBeInTheDocument();

      // dismiss the banner
      const dismissButton = screen.getByRole("button", { name: /dismiss/i });
      await userEvent.click(dismissButton);

      expect(title).not.toBeInTheDocument();
    });

    it("does not render the banner if completenessReviewDate is missing or phase is complete", () => {
      render(
        <TestProvider>
          <CompletenessPhase
            applicationId="app-123"
            applicationIntakeComplete={true}
            completenessReviewDate={undefined}
            fedCommentStartDate=""
            fedCommentEndDate=""
            completenessComplete={true}
            stateDeemedCompleteDate=""
            initialDocuments={[]}
          />
        </TestProvider>
      );

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});
