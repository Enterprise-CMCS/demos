import "@testing-library/jest-dom";

import React from "react";
import { TestProvider } from "test-utils/TestProvider";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  FEDERAL_COMMENT_PHASE_DESCRIPTION,
  FEDERAL_COMMENT_PHASE_STEP_ONE_DESCRIPTION,
  FEDERAL_COMMENT_PHASE_STEP_TWO_DESCRIPTION,
  FederalCommentPhase,
} from "./FederalCommentPhase";
import { TZDate } from "@date-fns/tz";
import { ApplicationWorkflowDocument } from "components/application";
import { DialogProvider } from "components/dialog/DialogContext";
import { EST_TIMEZONE } from "util/formatDate";
import type { CurrentUser } from "components/user/UserContext";
import { readonlyMockUser, cmsMockUser } from "mock-data/userMocks";
import { ToastContainer } from "components/toast/ToastContainer";

const FAKE_TODAY = "2026-02-08";

const mockSetApplicationDates = vi.fn<() => Promise<void>>();
let mutationLoading = false;
vi.mock("components/application/date/dateQueries", () => ({
  useSetApplicationDates: () => ({
    setApplicationDates: mockSetApplicationDates,
    loading: mutationLoading,
  }),
}));

beforeEach(() => {
  mockSetApplicationDates.mockReset().mockResolvedValue();
  mutationLoading = false;
});

const createDocument = (
  overrides: Partial<ApplicationWorkflowDocument> = {}
): ApplicationWorkflowDocument => ({
  id: "doc-1",
  name: "Test Document",
  description: "Some test doc",
  documentType: "General File",
  phaseName: "Federal Comment",
  createdAt: new TZDate("2025-01-02", EST_TIMEZONE),
  owner: { person: { fullName: "Test User" } },
  ...overrides,
});

const DEFAULT_START_DATE = "2025-01-01";
const DEFAULT_END_DATE = "2026-02-11";

const setup = (props = {}, currentUser?: CurrentUser) =>
  render(
    <TestProvider currentUser={currentUser}>
      <ToastContainer />
      <DialogProvider>
        <FederalCommentPhase
          demonstrationId="demo-123"
          phaseStartDate={DEFAULT_START_DATE}
          phaseEndDate={DEFAULT_END_DATE}
          phaseComplete={false}
          documents={[]}
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
      const header = screen.getByText("Federal Comment");
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass("text-brand");
    });

    it("renders description", () => {
      setup();
      expect(screen.getByTestId(FEDERAL_COMMENT_PHASE_DESCRIPTION.testId)).toHaveTextContent(
        FEDERAL_COMMENT_PHASE_DESCRIPTION.text
      );
    });
  });

  describe("Step 1 - Verify Section", () => {
    it("starts blank when no start date has been saved", () => {
      setup({ phaseStartDate: undefined, phaseEndDate: undefined });
      expect(screen.getByLabelText(/Federal Comment Period Start Date/)).toHaveValue("");
      expect(screen.getByTestId("federal-comment-period-end-date")).toHaveTextContent("--/--/----");
      expect(
        screen.getByRole("button", { name: "Declare Federal Comment Start Date" })
      ).toBeDisabled();
    });

    it.each([
      ["2026-10-27", "11/26/2026"],
      ["2026-03-01", "03/31/2026"],
      ["2026-12-15", "01/14/2027"],
      ["2028-02-01", "03/02/2028"],
    ])("calculates 30 calendar days after %s as read-only text", (startDate, expectedEndDate) => {
      setup();
      fireEvent.change(screen.getByLabelText(/Federal Comment Period Start Date/), {
        target: { value: startDate },
      });
      expect(screen.getByTestId("federal-comment-period-end-date")).toHaveTextContent(
        expectedEndDate
      );
      expect(screen.queryByLabelText("Federal Comment Period End Date")).not.toBeInTheDocument();
    });

    it("saves both plain dates together and shows success feedback", async () => {
      setup();
      fireEvent.change(screen.getByLabelText(/Federal Comment Period Start Date/), {
        target: { value: "2026-10-27" },
      });
      await userEvent.click(
        screen.getByRole("button", { name: "Declare Federal Comment Start Date" })
      );
      expect(mockSetApplicationDates).toHaveBeenCalledExactlyOnceWith({
        applicationId: "demo-123",
        applicationDates: [
          { dateType: "Federal Comment Period Start Date", plainDate: "2026-10-27" },
          { dateType: "Federal Comment Period End Date", plainDate: "2026-11-26" },
        ],
      });
      expect(await screen.findByText("Federal Comment Start Date declared.")).toBeInTheDocument();
      expect(screen.getByLabelText(/Federal Comment Period Start Date/)).toHaveValue("2026-10-27");
    });

    it("retains the selection and allows retry when the backend rejects the save", async () => {
      mockSetApplicationDates.mockRejectedValueOnce(new Error("Dates cannot be changed"));
      setup();
      fireEvent.change(screen.getByLabelText(/Federal Comment Period Start Date/), {
        target: { value: "2026-10-27" },
      });
      const button = screen.getByRole("button", { name: "Declare Federal Comment Start Date" });
      await userEvent.click(button);
      expect(await screen.findByText("Dates cannot be changed")).toBeInTheDocument();
      expect(screen.getByLabelText(/Federal Comment Period Start Date/)).toHaveValue("2026-10-27");
      expect(button).toBeEnabled();
      await userEvent.click(button);
      expect(mockSetApplicationDates).toHaveBeenCalledTimes(2);
    });

    it("does not save an empty start date", async () => {
      setup();
      fireEvent.change(screen.getByLabelText(/Federal Comment Period Start Date/), {
        target: { value: "" },
      });
      const button = screen.getByRole("button", { name: "Declare Federal Comment Start Date" });
      expect(button).toBeDisabled();
      await userEvent.click(button);
      expect(mockSetApplicationDates).not.toHaveBeenCalled();
    });

    it("disables unchanged saved dates", () => {
      setup({ phaseStartDate: "2026-10-27", phaseEndDate: "2026-11-26" });
      expect(
        screen.getByRole("button", { name: "Declare Federal Comment Start Date" })
      ).toBeDisabled();
    });

    it("disables date entry and declaration while the mutation is loading", () => {
      mutationLoading = true;
      setup();
      expect(screen.getByLabelText(/Federal Comment Period Start Date/)).toBeDisabled();
      expect(
        screen.getByRole("button", { name: "Declare Federal Comment Start Date" })
      ).toBeDisabled();
    });

    it("disables date entry and declaration for a completed phase", () => {
      setup({ phaseComplete: true });
      expect(screen.getByLabelText(/Federal Comment Period Start Date/)).toBeDisabled();
      expect(
        screen.getByRole("button", { name: "Declare Federal Comment Start Date" })
      ).toBeDisabled();
    });

    it("disables date entry and hides declaration for readonly users", () => {
      setup({}, readonlyMockUser);
      expect(screen.getByLabelText(/Federal Comment Period Start Date/)).toBeDisabled();
      expect(
        screen.queryByRole("button", { name: "Declare Federal Comment Start Date" })
      ).not.toBeInTheDocument();
    });

    it("renders step 1 title and description", () => {
      setup();
      expect(screen.getByText("Step 1 - Verify")).toBeInTheDocument();
      expect(
        screen.getByTestId(FEDERAL_COMMENT_PHASE_STEP_ONE_DESCRIPTION.testId)
      ).toHaveTextContent(FEDERAL_COMMENT_PHASE_STEP_ONE_DESCRIPTION.text);
    });

    it("shows formatted start and end dates", () => {
      setup();
      expect(screen.getByText(/Federal Comment Period Start Date/i)).toBeInTheDocument();
      expect(screen.getByText(/Federal Comment Period End Date/i)).toBeInTheDocument();
    });
  });

  describe("Step 2 - Upload Section", () => {
    it("renders upload section with title and helper text", () => {
      setup();
      expect(screen.getByText("Step 2 - Upload")).toBeInTheDocument();
      expect(screen.getByText(FEDERAL_COMMENT_PHASE_STEP_TWO_DESCRIPTION.text)).toBeInTheDocument();
    });

    it("shows 'No documents yet' when no documents", () => {
      setup();
      expect(screen.getByText("No documents yet.")).toBeInTheDocument();
    });

    it("renders document row when provided", () => {
      setup({ documents: [createDocument()] });
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

  describe("Readonly User Behavior", () => {
    it("hides upload button for readonly users", () => {
      setup({}, readonlyMockUser);
      expect(screen.queryByRole("button", { name: /upload/i })).not.toBeInTheDocument();
    });

    it("shows upload button for non-readonly users", () => {
      setup({}, cmsMockUser);
      expect(screen.getByRole("button", { name: /upload/i })).toBeInTheDocument();
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
        phaseStartDate: "2026-01-01",
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
