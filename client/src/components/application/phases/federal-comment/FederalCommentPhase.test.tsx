import "@testing-library/jest-dom";

import React from "react";
import { TestProvider } from "test-utils/TestProvider";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
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
vi.mock("components/application/date/dateQueries", () => ({
  useSetApplicationDates: () => ({ setApplicationDates: mockSetApplicationDates }),
}));

beforeEach(() => {
  vi.stubGlobal("__FEATURE_DECLARE_FEDERAL_COMMENT_DATES_IN_PHASE_4__", false);
  mockSetApplicationDates.mockReset().mockResolvedValue();
  vi.setSystemTime(`${FAKE_TODAY}T12:00:00Z`);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
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

const setup = (
  props: Partial<React.ComponentProps<typeof FederalCommentPhase>> = {},
  currentUser?: CurrentUser
) =>
  render(
    <TestProvider currentUser={currentUser}>
      <ToastContainer />
      <DialogProvider>
        <FederalCommentPhase
          demonstrationId="demo-123"
          phaseStartDate={DEFAULT_START_DATE}
          phaseEndDate={DEFAULT_END_DATE}
          phaseComplete={false}
          completenessComplete={true}
          stateDeemedCompleteDate="2025-01-01"
          documents={[]}
          {...props}
        />
      </DialogProvider>
    </TestProvider>
  );

describe("FederalCommentPhase", () => {
  describe("Phase 4 declaration enabled", () => {
    beforeEach(() => {
      vi.stubGlobal("__FEATURE_DECLARE_FEDERAL_COMMENT_DATES_IN_PHASE_4__", true);
    });

    it("starts blank and calculates a non-editable end date from the selected start", () => {
      setup({ phaseStartDate: undefined, phaseEndDate: undefined });
      const startInput = screen.getByLabelText(/Federal Comment Period Start Date/);
      expect(startInput).toHaveValue("");
      expect(
        screen.getByRole("button", { name: "Declare Federal Comment Start Date" })
      ).toBeDisabled();

      fireEvent.change(startInput, { target: { value: "2026-10-27" } });
      expect(screen.getByTestId("federal-comment-period-end-date")).toHaveTextContent("11/26/2026");
      expect(screen.queryByLabelText("Federal Comment Period End Date")).not.toBeInTheDocument();
      expect(screen.queryByText(/days left/i)).not.toBeInTheDocument();
    });

    it("saves both dates once and shows the banner after the first declaration", async () => {
      vi.setSystemTime("2026-10-30T12:00:00Z");
      setup({ phaseStartDate: undefined, phaseEndDate: undefined });
      fireEvent.change(screen.getByLabelText(/Federal Comment Period Start Date/), {
        target: { value: "2026-10-27" },
      });
      const declareButton = screen.getByRole("button", {
        name: "Declare Federal Comment Start Date",
      });
      await userEvent.click(declareButton);

      expect(mockSetApplicationDates).toHaveBeenCalledExactlyOnceWith({
        applicationId: "demo-123",
        applicationDates: [
          { dateType: "Federal Comment Period Start Date", plainDate: "2026-10-27" },
          { dateType: "Federal Comment Period End Date", plainDate: "2026-11-26" },
        ],
      });
      await waitFor(() =>
        expect(screen.getByText("27 days left in Federal Comment Period")).toBeInTheDocument()
      );
      expect(screen.getByText("The Federal Comment Period ends on 11/26/2026")).toBeInTheDocument();
      expect(declareButton).toBeDisabled();
      expect(screen.getByLabelText(/Federal Comment Period Start Date/)).toBeDisabled();
    });
  });

  describe("Declaration safeguards", () => {
    beforeEach(() => {
      vi.stubGlobal("__FEATURE_DECLARE_FEDERAL_COMMENT_DATES_IN_PHASE_4__", true);
    });

    it.each([
      ["2026-03-01", "03/31/2026"],
      ["2026-12-15", "01/14/2027"],
      ["2028-02-01", "03/02/2028"],
    ])("adds 30 calendar days to %s", (startDate, expectedEndDate) => {
      setup({ phaseStartDate: undefined, phaseEndDate: undefined });
      fireEvent.change(screen.getByLabelText(/Federal Comment Period Start Date/), {
        target: { value: startDate },
      });
      expect(screen.getByTestId("federal-comment-period-end-date")).toHaveTextContent(
        expectedEndDate
      );
    });

    it.each(["", "2025-01-01", "2100-01-01"])(
      "does not save a cleared or out-of-range date: %s",
      async (invalidDate) => {
        setup({ phaseStartDate: undefined, phaseEndDate: undefined });
        const startInput = screen.getByLabelText(/Federal Comment Period Start Date/);
        fireEvent.change(startInput, { target: { value: "2026-10-27" } });
        fireEvent.change(startInput, { target: { value: invalidDate } });
        const declareButton = screen.getByRole("button", {
          name: "Declare Federal Comment Start Date",
        });
        expect(declareButton).toBeDisabled();
        expect(screen.getByTestId("federal-comment-period-end-date")).toHaveTextContent(
          "--/--/----"
        );
        await userEvent.click(declareButton);
        expect(mockSetApplicationDates).not.toHaveBeenCalled();
      }
    );

    it("keeps existing dates unchanged and locked", () => {
      setup();
      expect(screen.getByLabelText(/Federal Comment Period Start Date/)).toHaveValue(
        DEFAULT_START_DATE
      );
      expect(screen.getByLabelText(/Federal Comment Period Start Date/)).toBeDisabled();
      expect(screen.getByTestId("federal-comment-period-end-date")).toHaveTextContent("02/11/2026");
      expect(
        screen.getByRole("button", { name: "Declare Federal Comment Start Date" })
      ).toBeDisabled();
      expect(mockSetApplicationDates).not.toHaveBeenCalled();
    });

    it("prevents readonly users from declaring dates", () => {
      setup({ phaseStartDate: undefined, phaseEndDate: undefined }, readonlyMockUser);
      expect(screen.getByLabelText(/Federal Comment Period Start Date/)).toBeDisabled();
      expect(
        screen.queryByRole("button", { name: "Declare Federal Comment Start Date" })
      ).not.toBeInTheDocument();
    });

    it.each([
      { completenessComplete: false },
      { phaseComplete: true },
      { stateDeemedCompleteDate: "" },
    ])("prevents declaration when prerequisites are unmet: %j", (props) => {
      setup({ phaseStartDate: undefined, phaseEndDate: undefined, ...props });
      expect(screen.getByLabelText(/Federal Comment Period Start Date/)).toBeDisabled();
      expect(
        screen.getByRole("button", { name: "Declare Federal Comment Start Date" })
      ).toBeDisabled();
    });

    it("disables controls while saving and prevents a duplicate declaration", async () => {
      let finishSave = () => {};
      mockSetApplicationDates.mockReturnValueOnce(
        new Promise<void>((resolve) => {
          finishSave = resolve;
        })
      );
      setup({ phaseStartDate: undefined, phaseEndDate: undefined });
      const startInput = screen.getByLabelText(/Federal Comment Period Start Date/);
      fireEvent.change(startInput, { target: { value: "2026-10-27" } });
      const declareButton = screen.getByRole("button", {
        name: "Declare Federal Comment Start Date",
      });
      await userEvent.click(declareButton);
      expect(declareButton).toBeDisabled();
      expect(startInput).toBeDisabled();
      await userEvent.click(declareButton);
      expect(mockSetApplicationDates).toHaveBeenCalledTimes(1);
      await act(async () => finishSave());
      expect(declareButton).toBeDisabled();
    });

    it("keeps the draft and allows retry when saving fails", async () => {
      mockSetApplicationDates.mockRejectedValueOnce(new Error("Unable to save dates"));
      setup({ phaseStartDate: undefined, phaseEndDate: undefined });
      const startInput = screen.getByLabelText(/Federal Comment Period Start Date/);
      fireEvent.change(startInput, { target: { value: "2026-10-27" } });
      const declareButton = screen.getByRole("button", {
        name: "Declare Federal Comment Start Date",
      });
      await userEvent.click(declareButton);
      expect(await screen.findByText("Unable to save dates")).toBeInTheDocument();
      expect(startInput).toHaveValue("2026-10-27");
      expect(declareButton).toBeEnabled();
      expect(screen.queryByText(/days left/i)).not.toBeInTheDocument();
      await userEvent.click(declareButton);
      expect(mockSetApplicationDates).toHaveBeenCalledTimes(2);
      expect(declareButton).toBeDisabled();
    });

    it("uses the Eastern calendar date for the countdown near midnight UTC", () => {
      vi.setSystemTime("2026-11-26T02:00:00Z");
      setup({ phaseEndDate: "2026-11-26" });
      expect(screen.getByText("1 day left in Federal Comment Period")).toBeInTheDocument();
    });

    it("does not report the end date as past due until the following day", () => {
      vi.setSystemTime("2026-11-26T12:00:00Z");
      setup({ phaseEndDate: "2026-11-26" });
      expect(screen.getByText("0 days left in Federal Comment Period")).toBeInTheDocument();
      expect(screen.queryByText(/past due/i)).not.toBeInTheDocument();
    });
  });

  describe("Warning Banner", () => {
    it("keeps declaration controls hidden when the flag is disabled", () => {
      setup();
      expect(screen.queryByLabelText(/Federal Comment Period Start Date/)).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Declare Federal Comment Start Date" })
      ).not.toBeInTheDocument();
    });

    it("renders warning with days left", () => {
      setup();
      expect(screen.getByLabelText("Warning")).toBeInTheDocument();
      expect(screen.getByText(/days left/i, { exact: false })).toBeInTheDocument();
      expect(screen.getByText(/The Federal Comment Period ends on/i)).toBeInTheDocument();
    });

    it("uses correct singular/plural for day left", () => {
      setup({ phaseEndDate: "2026-02-09" });
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
        phaseEndDate: "2026-02-13",
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
        phaseEndDate: "2026-02-05",
      });

      expect(screen.getByText(/3 days past due/i)).toBeInTheDocument();
      expect(screen.getByText(/The Federal Comment Period ended on/i)).toBeInTheDocument();
    });

    it("does not render banner if phase is complete", () => {
      setup({
        phaseStartDate: FAKE_TODAY,
        phaseEndDate: "2026-02-13",
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
