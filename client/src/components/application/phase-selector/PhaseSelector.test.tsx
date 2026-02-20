import React from "react";

import { TestProvider } from "test-utils/TestProvider";
import { describe, expect, it, vi } from "vitest";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PhaseSelector, getDisplayedPhaseStatus, getDisplayedPhaseDate } from "./PhaseSelector";
import { ApplicationWorkflowDemonstration } from "../ApplicationWorkflow";
import {
  getReviewPhaseComponentFromDemonstration,
  getApplicationCompletenessFromDemonstration,
  SdgPreparationPhase,
  getApprovalPackagePhase,
} from "../phases";

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
    getApplicationCompletenessFromDemonstration: vi.fn(),
    SdgPreparationPhase: vi.fn(() => <div>SDG Preparation Phase Mock</div>),
    getApprovalPackagePhase: vi.fn(),
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
      demonstrationTypes: [],
      tags: [],
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
      demonstrationTypes: [],
      tags: [],
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
      demonstrationTypes: [],
      tags: [],
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
      demonstrationTypes: [],
      tags: [],
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
      demonstrationTypes: [],
      tags: [],
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
      demonstrationTypes: [],
      tags: [],
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
      demonstrationTypes: [],
      tags: [],
    };

    expect(getDisplayedPhaseDate(demonstration, "Concept")).toBeUndefined();
  });

  it("returns undefined when phase has no relevant dates based on status and phase name", () => {
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
          phaseStatus: "Completed",
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
      demonstrationTypes: [],
      tags: [],
    };

    const result = getDisplayedPhaseDate(demonstration, "Application Intake");
    expect(result).toEqual(undefined);
  });

  it("does not match 'Completeness Start Date' as a completion date", () => {
    const completionDate = new Date("2025-03-15");
    const completenessStartDate = new Date("2025-01-01");

    const demonstration: ApplicationWorkflowDemonstration = {
      id: "test-id",
      name: "Test Demo",
      state: { id: "CA", name: "California" },
      primaryProjectOfficer: mockPO,
      status: "Under Review",
      currentPhaseName: "Completeness",
      clearanceLevel: "CMS (OSORA)",
      phases: [
        {
          phaseName: "Completeness",
          phaseStatus: "Completed",
          phaseDates: [
            {
              dateType: "Completeness Start Date",
              dateValue: completenessStartDate,
            },
            {
              dateType: "Completeness Completion Date",
              dateValue: completionDate,
            },
          ],
          phaseNotes: [],
        },
      ],
      documents: [],
      demonstrationTypes: [],
      tags: [],
    };

    const result = getDisplayedPhaseDate(demonstration, "Completeness");
    expect(result).toEqual(completionDate);
  });

  it("uses start date when phase is Started even if completion date exists", () => {
    const startDate = new Date("2025-01-01");
    const completionDate = new Date("2025-03-15");

    const demonstration: ApplicationWorkflowDemonstration = {
      id: "test-id",
      name: "Test Demo",
      state: { id: "CA", name: "California" },
      primaryProjectOfficer: mockPO,
      status: "Under Review",
      currentPhaseName: "Concept",
      clearanceLevel: "CMS (OSORA)",
      phases: [
        {
          phaseName: "Concept",
          phaseStatus: "Started",
          phaseDates: [
            {
              dateType: "Concept Start Date",
              dateValue: startDate,
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
      demonstrationTypes: [],
      tags: [],
    };

    const result = getDisplayedPhaseDate(demonstration, "Concept");

    expect(result).toEqual(startDate);
  });

  it("selects start date based on phase status", () => {
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
      demonstrationTypes: [],
      tags: [],
    };

    const result = getDisplayedPhaseDate(demonstration, "Federal Comment");
    expect(result).toEqual(startDate);
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
      demonstrationTypes: [],
      tags: [],
    };

    const result = getDisplayedPhaseDate(demonstration, "Concept");
    expect(result).toBeInstanceOf(Date);
    expect(result).toEqual(dateValue);
  });
});

describe("completeness phase component", () => {
  it("calls getApplicationCompletenessFromDemonstration with correct props when Completeness is selected", async () => {
    vi.mocked(getApplicationCompletenessFromDemonstration).mockReturnValue(
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
      currentPhaseName: "Completeness",
      clearanceLevel: "CMS (OSORA)",
      phases: [],
      documents: [],
      demonstrationTypes: [],
      tags: [],
    };

    render(
      <TestProvider>
        <PhaseSelector demonstration={demonstration} />
      </TestProvider>
    );

    expect(getApplicationCompletenessFromDemonstration).toHaveBeenCalledWith(
      demonstration,
      expect.any(Function)
    );
  });
});

describe("sdg preparation phase component", () => {
  it("renders sdg preparation phase with correct props when sdg preparation is selected", async () => {
    const sdgPhase = {
      phaseName: "SDG Preparation" as const,
      phaseStatus: "Started" as const,
      phaseDates: [],
      phaseNotes: [],
    };

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
      phases: [sdgPhase],
      documents: [],
      demonstrationTypes: [],
      tags: [],
    };

    render(
      <TestProvider>
        <PhaseSelector demonstration={demonstration} />
      </TestProvider>
    );

    expect(SdgPreparationPhase).toHaveBeenCalledWith(
      {
        demonstrationId: "test-id",
        sdgPreparationPhase: sdgPhase,
        setSelectedPhase: expect.any(Function),
      },
      undefined
    );
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
      demonstrationTypes: [],
      tags: [],
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

describe("completeness phase component", () => {
  it("calls getApprovalPackagePhase with correct props when Approval Package is selected", async () => {
    vi.mocked(getApprovalPackagePhase).mockReturnValue(<div>Approval Package Phase Mock</div>);

    const demonstration: ApplicationWorkflowDemonstration = {
      id: "test-id",
      name: "Test Demo",
      state: {
        id: "CA",
        name: "California",
      },
      primaryProjectOfficer: mockPO,
      status: "Under Review",
      currentPhaseName: "Approval Package",
      clearanceLevel: "CMS (OSORA)",
      phases: [],
      documents: [],
      demonstrationTypes: [],
      tags: [],
    };

    render(
      <TestProvider>
        <PhaseSelector demonstration={demonstration} />
      </TestProvider>
    );

    expect(getApprovalPackagePhase).toHaveBeenCalledWith(demonstration, expect.any(Function));
  });
});
