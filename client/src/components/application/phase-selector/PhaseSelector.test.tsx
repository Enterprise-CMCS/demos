import React from "react";

import { TestProvider } from "test-utils/TestProvider";
import { describe, expect, it, vi } from "vitest";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PhaseSelector, getDisplayedPhaseStatus, getDisplayedPhaseDate } from "./PhaseSelector";
import { ApplicationWorkflowDemonstration } from "../ApplicationWorkflow";
import { getReviewPhaseComponentFromDemonstration } from "../phases";

const mockPO = {
  id: "po-1",
  fullName: "Jane Doe",
};

vi.mock("components/dialog/DialogContext", () => ({
  useDialog: () => ({}),
}));

vi.mock("../phases", async () => {
  const actual = await vi.importActual("../phases");
  return {
    ...actual,
    getReviewPhaseComponentFromDemonstration: vi.fn(),
  };
});

describe("PhaseSelector", () => {
  it("renders all phase names", () => {
    const demonstration: ApplicationWorkflowDemonstration = {
      id: "fcf8d9f9-03ff-4092-b784-937a760e5f5b",
      name: "Test Demo",
      state: {
        id: "CA",
        name: "California",
      },
      primaryProjectOfficer: mockPO,
      status: "Under Review",
      currentPhaseName: "Federal Comment",
      clearanceLevel: "CMS (OSORA)",
      phases: [],
      documents: [],
    };

    render(
      <TestProvider>
        <PhaseSelector demonstration={demonstration} />
      </TestProvider>
    );
    [
      "Concept",
      "Application Intake",
      "Completeness",
      "Federal Comment",
      "SDG Preparation",
      "Review",
      "Approval Package",
      "Approval Summary",
    ].forEach((name) => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });
  });

  it("renders only three phase group categories", () => {
    const demonstration: ApplicationWorkflowDemonstration = {
      id: "fcf8d9f9-03ff-4092-b784-937a760e5f5b",
      name: "Test Demo",
      state: {
        id: "CA",
        name: "California",
      },
      primaryProjectOfficer: mockPO,
      status: "Under Review",
      currentPhaseName: "Federal Comment",
      clearanceLevel: "CMS (OSORA)",
      phases: [],
      documents: [],
    };

    render(
      <TestProvider>
        <PhaseSelector demonstration={demonstration} />
      </TestProvider>
    );

    expect(screen.getByText("Pre-Submission")).toBeInTheDocument();
    expect(screen.getByText("Submission")).toBeInTheDocument();
    expect(screen.getByText("Approval")).toBeInTheDocument();
    expect(screen.queryByText("Post-Approval")).not.toBeInTheDocument();
  });
});

describe("getDisplayedPhaseStatus", () => {
  it("returns the phase status when phase exists", () => {
    const demonstration: ApplicationWorkflowDemonstration = {
      id: "test-id",
      name: "Test Demo",
      state: {
        id: "CA",
        name: "California",
      },
      primaryProjectOfficer: mockPO,
      status: "Under Review",
      currentPhaseName: "Concept",
      clearanceLevel: "CMS (OSORA)",
      phases: [
        {
          phaseName: "Concept",
          phaseStatus: "Started",
          phaseDates: [],
          phaseNotes: [],
        },
        {
          phaseName: "Application Intake",
          phaseStatus: "Completed",
          phaseDates: [],
          phaseNotes: [],
        },
      ],
      documents: [],
    };

    expect(getDisplayedPhaseStatus(demonstration, "Concept")).toBe("Started");
    expect(getDisplayedPhaseStatus(demonstration, "Application Intake")).toBe("Completed");
  });

  it("returns 'Not Started' when phase does not exist", () => {
    const demonstration: ApplicationWorkflowDemonstration = {
      id: "test-id",
      name: "Test Demo",
      state: {
        id: "CA",
        name: "California",
      },
      primaryProjectOfficer: mockPO,
      status: "Under Review",
      currentPhaseName: "Concept",
      clearanceLevel: "CMS (OSORA)",
      phases: [
        {
          phaseName: "Concept",
          phaseStatus: "Started",
          phaseDates: [],
          phaseNotes: [],
        },
      ],
      documents: [],
    };

    expect(getDisplayedPhaseStatus(demonstration, "Completeness")).toBe("Not Started");
  });

  it("returns 'Not Started' when phases array is empty", () => {
    const demonstration: ApplicationWorkflowDemonstration = {
      id: "test-id",
      name: "Test Demo",
      state: {
        id: "CA",
        name: "California",
      },
      primaryProjectOfficer: mockPO,
      status: "Under Review",
      currentPhaseName: "Concept",
      clearanceLevel: "CMS (OSORA)",
      phases: [],
      documents: [],
    };

    expect(getDisplayedPhaseStatus(demonstration, "Concept")).toBe("Not Started");
  });
});

describe("getDisplayedPhaseDate", () => {
  it("returns undefined when phase does not exist", () => {
    const demonstration: ApplicationWorkflowDemonstration = {
      id: "test-id",
      name: "Test Demo",
      state: {
        id: "CA",
        name: "California",
      },
      primaryProjectOfficer: mockPO,
      status: "Under Review",
      currentPhaseName: "Concept",
      clearanceLevel: "CMS (OSORA)",
      phases: [],
      documents: [],
    };

    expect(getDisplayedPhaseDate(demonstration, "Concept")).toBeUndefined();
  });

  it("returns undefined when phase has no dates", () => {
    const demonstration: ApplicationWorkflowDemonstration = {
      id: "test-id",
      name: "Test Demo",
      state: {
        id: "CA",
        name: "California",
      },
      primaryProjectOfficer: mockPO,
      status: "Under Review",
      currentPhaseName: "Concept",
      clearanceLevel: "CMS (OSORA)",
      phases: [
        {
          phaseName: "Concept",
          phaseStatus: "Started",
          phaseDates: [],
          phaseNotes: [],
        },
      ],
      documents: [],
    };

    expect(getDisplayedPhaseDate(demonstration, "Concept")).toBeUndefined();
  });

  it("prioritizes completion dates", () => {
    const completionDate = new Date("2025-03-15");
    const startDate = new Date("2025-01-10");
    const submittedDate = new Date("2025-02-20");

    const demonstration: ApplicationWorkflowDemonstration = {
      id: "test-id",
      name: "Test Demo",
      state: {
        id: "CA",
        name: "California",
      },
      primaryProjectOfficer: mockPO,
      status: "Under Review",
      currentPhaseName: "Concept",
      clearanceLevel: "CMS (OSORA)",
      phases: [
        {
          phaseName: "Concept",
          phaseStatus: "Completed",
          phaseDates: [
            {
              dateType: "Concept Start Date",
              dateValue: startDate,
            },
            {
              dateType: "Pre-Submission Submitted Date",
              dateValue: submittedDate,
            },
            {
              dateType: "Concept Completion Date",
              dateValue: completionDate,
            },
          ],
          phaseNotes: [],
        },
      ],
      documents: [],
    };

    const result = getDisplayedPhaseDate(demonstration, "Concept");
    expect(result).toEqual(completionDate);
  });

  it("prioritizes dates with 'Complete' in the name", () => {
    const completeDate = new Date("2025-04-01");
    const startDate = new Date("2025-01-10");

    const demonstration: ApplicationWorkflowDemonstration = {
      id: "test-id",
      name: "Test Demo",
      state: {
        id: "CA",
        name: "California",
      },
      primaryProjectOfficer: mockPO,
      status: "Under Review",
      currentPhaseName: "Review",
      clearanceLevel: "CMS (OSORA)",
      phases: [
        {
          phaseName: "Review",
          phaseStatus: "Completed",
          phaseDates: [
            {
              dateType: "Review Start Date",
              dateValue: startDate,
            },
            {
              dateType: "Review Completion Date",
              dateValue: completeDate,
            },
          ],
          phaseNotes: [],
        },
      ],
      documents: [],
    };

    const result = getDisplayedPhaseDate(demonstration, "Review");
    expect(result).toEqual(completeDate);
  });

  it("falls back to submitted dates when no completion date exists", () => {
    const submittedDate = new Date("2025-02-20");
    const startDate = new Date("2025-01-10");

    const demonstration: ApplicationWorkflowDemonstration = {
      id: "test-id",
      name: "Test Demo",
      state: {
        id: "CA",
        name: "California",
      },
      primaryProjectOfficer: mockPO,
      status: "Under Review",
      currentPhaseName: "Application Intake",
      clearanceLevel: "CMS (OSORA)",
      phases: [
        {
          phaseName: "Application Intake",
          phaseStatus: "Started",
          phaseDates: [
            {
              dateType: "Application Intake Start Date",
              dateValue: startDate,
            },
            {
              dateType: "State Application Submitted Date",
              dateValue: submittedDate,
            },
          ],
          phaseNotes: [],
        },
      ],
      documents: [],
    };

    const result = getDisplayedPhaseDate(demonstration, "Application Intake");
    expect(result).toEqual(submittedDate);
  });

  it("falls back to start dates when no completion or submitted date exists", () => {
    const startDate = new Date("2025-01-10");

    const demonstration: ApplicationWorkflowDemonstration = {
      id: "test-id",
      name: "Test Demo",
      state: {
        id: "CA",
        name: "California",
      },
      primaryProjectOfficer: mockPO,
      status: "Under Review",
      currentPhaseName: "Federal Comment",
      clearanceLevel: "CMS (OSORA)",
      phases: [
        {
          phaseName: "Federal Comment",
          phaseStatus: "Started",
          phaseDates: [
            {
              dateType: "Federal Comment Period Start Date",
              dateValue: startDate,
            },
          ],
          phaseNotes: [],
        },
      ],
      documents: [],
    };

    const result = getDisplayedPhaseDate(demonstration, "Federal Comment");
    expect(result).toEqual(startDate);
  });

  it("falls back to the first date when no priority dates exist", () => {
    const firstDate = new Date("2025-05-01");
    const secondDate = new Date("2025-06-01");

    const demonstration: ApplicationWorkflowDemonstration = {
      id: "test-id",
      name: "Test Demo",
      state: {
        id: "CA",
        name: "California",
      },
      primaryProjectOfficer: mockPO,
      status: "Under Review",
      currentPhaseName: "SDG Preparation",
      clearanceLevel: "CMS (OSORA)",
      phases: [
        {
          phaseName: "SDG Preparation",
          phaseStatus: "Started",
          phaseDates: [
            {
              dateType: "Expected Approval Date",
              dateValue: firstDate,
            },
            {
              dateType: "SME Review Date",
              dateValue: secondDate,
            },
          ],
          phaseNotes: [],
        },
      ],
      documents: [],
    };

    const result = getDisplayedPhaseDate(demonstration, "SDG Preparation");
    expect(result).toEqual(firstDate);
  });

  it("converts date value to Date object", () => {
    const dateValue = new Date("2025-03-15");

    const demonstration: ApplicationWorkflowDemonstration = {
      id: "test-id",
      name: "Test Demo",
      state: {
        id: "CA",
        name: "California",
      },
      primaryProjectOfficer: mockPO,
      status: "Under Review",
      currentPhaseName: "Concept",
      clearanceLevel: "CMS (OSORA)",
      phases: [
        {
          phaseName: "Concept",
          phaseStatus: "Completed",
          phaseDates: [
            {
              dateType: "Concept Completion Date",
              dateValue,
            },
          ],
          phaseNotes: [],
        },
      ],
      documents: [],
    };

    const result = getDisplayedPhaseDate(demonstration, "Concept");
    expect(result).toBeInstanceOf(Date);
    expect(result).toEqual(dateValue);
  });
});

describe("Review phase component", () => {
  it("calls getReviewPhaseComponentFromDemonstration with correct props when Review is selected", async () => {
    const user = userEvent.setup();
    vi.mocked(getReviewPhaseComponentFromDemonstration).mockReturnValue(
      <div>Review Phase Mock</div>
    );

    const demonstration: ApplicationWorkflowDemonstration = {
      id: "test-id",
      name: "Test Demo",
      state: {
        id: "CA",
        name: "California",
      },
      primaryProjectOfficer: mockPO,
      status: "Under Review",
      currentPhaseName: "Concept",
      clearanceLevel: "CMS (OSORA)",
      phases: [],
      documents: [],
    };

    render(
      <TestProvider>
        <PhaseSelector demonstration={demonstration} />
      </TestProvider>
    );

    // Click on the Review phase box
    const reviewPhaseBox = screen.getByText("Review");
    await user.click(reviewPhaseBox);

    // Wait for the component to update and verify Review phase is selected
    await waitFor(() => {
      expect(reviewPhaseBox.closest("div")).toHaveClass("scale-110");
    });

    // Verify getReviewPhaseComponentFromDemonstration was called
    expect(getReviewPhaseComponentFromDemonstration).toHaveBeenCalledTimes(1);
    expect(getReviewPhaseComponentFromDemonstration).toHaveBeenCalledWith(
      demonstration,
      expect.any(Function)
    );

    // Extract and invoke the callback to verify it transitions to Approval Package
    const callback = vi.mocked(getReviewPhaseComponentFromDemonstration).mock.calls[0][1];
    callback();

    // Wait for state update and verify Approval Package phase becomes selected
    await waitFor(() => {
      const approvalPackageBox = screen.getByText("Approval Package");
      expect(approvalPackageBox.closest("div")).toHaveClass("scale-110");
    });

    // Verify Review phase is no longer selected
    await waitFor(() => {
      expect(reviewPhaseBox.closest("div")).not.toHaveClass("scale-110");
    });
  });
});
