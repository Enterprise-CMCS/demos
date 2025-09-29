import React from "react";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { format } from "date-fns";

import { ToastProvider } from "components/toast";
import { MockedProvider } from "@apollo/client/testing";
import * as env from "config/env";
import { PhaseStatusContext, PhaseStatusContextValue } from "../phase-selector/PhaseStatusContext";
import { CompletenessPhase } from "./CompletenessPhase";

const mockContextValue: PhaseStatusContextValue = {
  phaseStatusLookup: {
    Concept: "Not Started",
    "State Application": "Completed",
    Completeness: "Started",
    "Federal Comment": "Not Started",
    "SME/FRT": "Not Started",
    "OGC & OMB": "Not Started",
    "Approval Package": "Not Started",
    "Post Approval": "Not Started",
  },
  updatePhaseStatus: vi.fn(),
  phaseMetaLookup: {},
  updatePhaseMeta: vi.fn(),
  selectedPhase: "Concept",
  selectPhase: vi.fn(),
  selectNextPhase: vi.fn(),
};

const renderWithContext = (ui: React.ReactNode, contextOverrides?: Partial<PhaseStatusContextValue>) => {
  const value = { ...mockContextValue, ...contextOverrides };
  return render(
    <PhaseStatusContext.Provider value={value}>
      <MockedProvider mocks={[]} addTypename={false}>
        <ToastProvider>{ui}</ToastProvider>
      </MockedProvider>
    </PhaseStatusContext.Provider>
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
    renderWithContext(<CompletenessPhase />);

    const finishButton = screen.getByRole("button", { name: /finish/i });
    expect(finishButton).toBeDisabled();
  });

  it("opens the declare incomplete dialog when requested", () => {
    renderWithContext(<CompletenessPhase />);

    fireEvent.click(screen.getByTestId("declare-incomplete"));

    expect(screen.getByRole("dialog")).toHaveTextContent("Declare Incomplete");
  });

  it("marks the phase complete once documents and dates are provided", () => {
    const updatePhaseStatus = vi.fn();
    const selectNextPhase = vi.fn();

    renderWithContext(<CompletenessPhase />, {
      updatePhaseStatus,
      selectNextPhase,
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

    expect(updatePhaseStatus).toHaveBeenCalledWith("Completeness", "Completed");
    expect(selectNextPhase).toHaveBeenCalledWith("Completeness");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("publishes notice metadata for the phase badge (future vs past due)", async () => {
    const updatePhaseMeta = vi.fn();

    renderWithContext(<CompletenessPhase />, {
      updatePhaseMeta,
    });

    // Build YYYY-MM-DD strings
    const today = new Date();
    const future = new Date(today);
    future.setDate(today.getDate() + 5);
    const past = new Date(today);
    past.setDate(today.getDate() - 1);

    const dueDateInput = screen.getByTestId("notice-due-date");
    fireEvent.change(dueDateInput, { target: { value: format(future, "yyyy-MM-dd") } });

    await waitFor(() => {
      expect(updatePhaseMeta).toHaveBeenCalledWith(
        "Completeness",
        expect.objectContaining({
          dueDate: expect.any(Date),
        })
      );
    });

    // Now set a PAST due date
    fireEvent.change(dueDateInput, { target: { value: format(past, "yyyy-MM-dd") } });

    await waitFor(() => {
      expect(updatePhaseMeta).toHaveBeenCalledWith(
        "Completeness",
        expect.objectContaining({
          dueDate: expect.any(Date),
        })
      );
    });
  });
});
