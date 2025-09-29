import React from "react";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { format } from "date-fns";

import { ToastProvider } from "components/toast";
import { MockedProvider } from "@apollo/client/testing";
import * as env from "config/env";
import { CompletenessPhase, CompletenessPhaseProps } from "./CompletenessPhase";

const renderCompletenessPhase = (props?: Partial<CompletenessPhaseProps>) => {
  const defaultProps: CompletenessPhaseProps = {
    phaseStatus: "Not Started",
    onPhaseStatusChange: vi.fn(),
    dueDate: undefined,
    onDueDateChange: vi.fn(),
    onAdvancePhase: vi.fn(),
  };

  return render(
    <MockedProvider mocks={[]} addTypename={false}>
      <ToastProvider>
        <CompletenessPhase {...defaultProps} {...props} />
      </ToastProvider>
    </MockedProvider>
  );
};

beforeEach(() => {
  vi.spyOn(env, "isLocalDevelopment").mockReturnValue(true);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("CompletenessPhase", () => {
  it("disables Finish until requirements are met", () => {
    renderCompletenessPhase();

    const finishButton = screen.getByRole("button", { name: /finish/i });
    expect(finishButton).toBeDisabled();
  });

  it("opens the declare incomplete dialog when requested", () => {
    renderCompletenessPhase();

    fireEvent.click(screen.getByTestId("declare-incomplete"));

    expect(screen.getByRole("dialog")).toHaveTextContent("Declare Incomplete");
  });

  it("marks the phase complete once documents and dates are provided", () => {
    const updatePhaseStatus = vi.fn();
    const selectNextPhase = vi.fn();

    renderCompletenessPhase({
      onPhaseStatusChange: updatePhaseStatus,
      onAdvancePhase: selectNextPhase,
    });

    fireEvent.click(screen.getByTestId("add-mock-completeness-doc"));

    fireEvent.change(screen.getByTestId("state-application-deemed-complete"), {
      target: { value: "2024-06-01" },
    });
    fireEvent.change(screen.getByTestId("federal-comment-period-start"), {
      target: { value: "2024-06-05" },
    });
    fireEvent.change(screen.getByTestId("federal-comment-period-end"), {
      target: { value: "2024-06-10" },
    });

    const finishButton = screen.getByTestId("finish-completeness");
    expect(finishButton).not.toBeDisabled();

    fireEvent.click(finishButton);

    expect(updatePhaseStatus).toHaveBeenCalledWith("Completed");
    expect(selectNextPhase).toHaveBeenCalled();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("publishes notice metadata for the phase badge (future vs past due)", async () => {
    const onDueDateChange = vi.fn();

    renderCompletenessPhase({ onDueDateChange });
    onDueDateChange.mockClear();

    // Build YYYY-MM-DD strings
    const today = new Date();
    const future = new Date(today);
    future.setDate(today.getDate() + 5);
    const past = new Date(today);
    past.setDate(today.getDate() - 1);

    const dueDateInput = screen.getByTestId("notice-due-date");
    fireEvent.change(dueDateInput, { target: { value: format(future, "yyyy-MM-dd") } });

    await waitFor(() => {
      expect(onDueDateChange).toHaveBeenCalledWith(expect.any(Date));
    });

    // Now set a PAST due date
    fireEvent.change(dueDateInput, { target: { value: format(past, "yyyy-MM-dd") } });

    await waitFor(() => {
      const datesProvided = onDueDateChange.mock.calls
        .map(([arg]) => arg)
        .filter((arg) => arg instanceof Date);
      expect(datesProvided.length).toBeGreaterThanOrEqual(2);
    });
  });
});
