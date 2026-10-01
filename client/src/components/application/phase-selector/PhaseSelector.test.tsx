import React from "react";

import { TestProvider } from "test-utils/TestProvider";
import { describe, expect, it, vi } from "vitest";

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  PhaseSelector,
  getDisplayedPhaseStatus,
  getDisplayedPhaseDate,
  PHASE_SELECTOR_CONTAINER_TEST_ID,
} from "./PhaseSelector";
import { ApplicationWorkflowDemonstration } from "../demonstration/DemonstrationWorkflow";
import {
  getApplicationIntakeComponentFromApplication,
  getReviewPhaseComponentFromApplication,
  getApplicationCompletenessFromApplication,
  getApprovalPackagePhaseFromApplication,
  getSdgPreparationPhaseFromApplication,
  getApprovalSummaryPhaseFromApplication,
} from "../phases";
import { PhaseName, PhaseStatus } from "demos-server";

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
    getApplicationIntakeComponentFromApplication: vi.fn(),
    getReviewPhaseComponentFromApplication: vi.fn(),
    getApplicationCompletenessFromApplication: vi.fn(),
    getSdgPreparationPhaseFromApplication: vi.fn(),
    getApprovalPackagePhaseFromApplication: vi.fn(),
    getApprovalSummaryPhaseFromApplication: vi.fn(),
  };
});

describe("PhaseSelector", () => {
  it("renders all phase names", () => {
    const demonstration: ApplicationWorkflowDemonstration = {
      id: "fcf8d9f9-03ff-4092-b784-937a760e5f5b",
      medicaidId: "123456789",
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
      suggestedApplicationTags: [],
    };

    render(
      <TestProvider>
        <PhaseSelector application={demonstration} workflowApplicationType="demonstration" />
      </TestProvider>
    );
    const phaseSelectorGrid = screen.getByTestId(PHASE_SELECTOR_CONTAINER_TEST_ID);

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
      expect(within(phaseSelectorGrid).getByText(name)).toBeInTheDocument();
    });
  });

  it("renders only three phase group categories", () => {
    const demonstration: ApplicationWorkflowDemonstration = {
      id: "fcf8d9f9-03ff-4092-b784-937a760e5f5b",
      medicaidId: "123456789",
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
      suggestedApplicationTags: [],
    };

    render(
      <TestProvider>
        <PhaseSelector application={demonstration} workflowApplicationType="demonstration" />
      </TestProvider>
    );

    expect(screen.getByText("Pre-Submission")).toBeInTheDocument();
    expect(screen.getByText("Submission")).toBeInTheDocument();
    expect(screen.getByText("Approval")).toBeInTheDocument();
    expect(screen.queryByText("Post-Approval")).not.toBeInTheDocument();
  });

  it("displays AI sparkles on Application Intake when pending suggestions exist", () => {
    vi.mocked(getApplicationCompletenessFromApplication).mockReturnValue(<div>Completeness</div>);

    const demonstration: ApplicationWorkflowDemonstration = {
      id: "fcf8d9f9-03ff-4092-b784-937a760e5f5b",
      medicaidId: "123456789",
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
      suggestedApplicationTags: ["Dental"],
    };

    render(
      <TestProvider>
        <PhaseSelector application={demonstration} workflowApplicationType="demonstration" />
      </TestProvider>
    );

    expect(screen.getByLabelText("DEMOS AI suggestions available")).toBeInTheDocument();
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
      medicaidId: "123456789",
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
      medicaidId: "123456789",
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
      medicaidId: "123456789",
    };

    expect(getDisplayedPhaseStatus(demonstration, "Concept")).toBe("Not Started");
  });
});

describe("getDisplayedPhaseDate", () => {
  it("returns undefined when phase does not exist", () => {
    const phases: Parameters<typeof getDisplayedPhaseDate>[0] = [
      {
        phaseName: "Application Intake" satisfies PhaseName,
        phaseStatus: "Completed" satisfies PhaseStatus,
        phaseDates: [
          {
            dateType: "Application Intake Start Date",
            plainDate: "1996-12-14",
          },
          {
            dateType: "State Application Submitted Date",
            plainDate: "1996-12-14",
          },
        ],
      },
    ];

    expect(getDisplayedPhaseDate(phases, "Concept")).toBeUndefined();
  });

  it("returns undefined when phase has no dates", () => {
    const phases: Parameters<typeof getDisplayedPhaseDate>[0] = [
      {
        phaseName: "Concept" satisfies PhaseName,
        phaseStatus: "Started",
        phaseDates: [],
      },
    ];
    expect(getDisplayedPhaseDate(phases, "Concept")).toBeUndefined();
  });

  it("returns undefined when phase has no relevant dates based on status and phase name", () => {
    const submittedDateString = "2025-02-20";
    const startDateString = "2025-01-10";

    const phases: Parameters<typeof getDisplayedPhaseDate>[0] = [
      {
        phaseName: "Application Intake" satisfies PhaseName,
        phaseStatus: "Completed",
        phaseDates: [
          {
            dateType: "Application Intake Start Date",
            plainDate: startDateString,
          },
          {
            dateType: "State Application Submitted Date",
            plainDate: submittedDateString,
          },
        ],
      },
    ];

    const result = getDisplayedPhaseDate(phases, "Application Intake");
    expect(result).toEqual(undefined);
  });

  it("does not match 'Completeness Start Date' as a completion date", () => {
    const completionDateString = "2025-03-15";
    const completenessStartDateString = "2025-01-01";

    const phases: Parameters<typeof getDisplayedPhaseDate>[0] = [
      {
        phaseName: "Completeness" satisfies PhaseName,
        phaseStatus: "Completed",
        phaseDates: [
          {
            dateType: "Completeness Start Date",
            plainDate: completenessStartDateString,
          },
          {
            dateType: "Completeness Completion Date",
            plainDate: completionDateString,
          },
        ],
      },
    ];

    const result = getDisplayedPhaseDate(phases, "Completeness");
    expect(result).toEqual(completionDateString);
  });

  it("uses start date when phase is Started even if completion date exists", () => {
    const startDateString = "2025-01-01";
    const completionDateString = "2025-03-15";

    const phases: Parameters<typeof getDisplayedPhaseDate>[0] = [
      {
        phaseName: "Concept" satisfies PhaseName,
        phaseStatus: "Started",
        phaseDates: [
          {
            dateType: "Concept Start Date",
            plainDate: startDateString,
          },
          {
            dateType: "Concept Completion Date",
            plainDate: completionDateString,
          },
        ],
      },
    ];

    const result = getDisplayedPhaseDate(phases, "Concept");

    expect(result).toEqual(startDateString);
  });

  it("selects start date based on phase status", () => {
    const startDateString = "2025-01-10";

    const phases: Parameters<typeof getDisplayedPhaseDate>[0] = [
      {
        phaseName: "Federal Comment" satisfies PhaseName,
        phaseStatus: "Started" satisfies PhaseStatus,
        phaseDates: [
          {
            dateType: "Federal Comment Period Start Date",
            plainDate: startDateString,
          },
        ],
      },
    ];

    const result = getDisplayedPhaseDate(phases, "Federal Comment");
    expect(result).toEqual(startDateString);
  });
});

describe("completeness phase component", () => {
  it("calls getApplicationCompletenessFromApplication with correct props when Completeness is selected", async () => {
    vi.mocked(getApplicationCompletenessFromApplication).mockReturnValue(
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
      medicaidId: "123456789",
    };

    render(
      <TestProvider>
        <PhaseSelector application={demonstration} workflowApplicationType="demonstration" />
      </TestProvider>
    );

    expect(getApplicationCompletenessFromApplication).toHaveBeenCalledWith(
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
      medicaidId: "123456789",
    };

    render(
      <TestProvider>
        <PhaseSelector application={demonstration} workflowApplicationType="demonstration" />
      </TestProvider>
    );

    expect(getSdgPreparationPhaseFromApplication).toHaveBeenCalledWith(
      demonstration,
      expect.any(Function)
    );
  });
});

describe("Review phase component", () => {
  it("calls getReviewPhaseComponentFromApplication with correct props when Review is selected", async () => {
    const user = userEvent.setup();
    vi.mocked(getReviewPhaseComponentFromApplication).mockReturnValue(<div>Review Phase Mock</div>);

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
      medicaidId: "123456789",
    };

    render(
      <TestProvider>
        <PhaseSelector application={demonstration} workflowApplicationType="demonstration" />
      </TestProvider>
    );

    // Click on the Review phase box
    const reviewPhaseBox = screen.getByText("Review");
    await user.click(reviewPhaseBox);

    // Wait for the component to update and verify Review phase is selected
    await waitFor(() => {
      expect(reviewPhaseBox.closest("div")).toHaveClass("scale-110");
    });

    // Verify getReviewPhaseComponentFromApplication was called
    expect(getReviewPhaseComponentFromApplication).toHaveBeenCalledTimes(1);
    expect(getReviewPhaseComponentFromApplication).toHaveBeenCalledWith(
      demonstration,
      expect.any(Function)
    );

    // Extract and invoke the callback to verify it transitions to Approval Package
    const callback = vi.mocked(getReviewPhaseComponentFromApplication).mock.calls[0][1];
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
  it("calls getApprovalPackagePhaseFromApplication with correct props when Approval Package is selected", async () => {
    vi.mocked(getApprovalPackagePhaseFromApplication).mockReturnValue(
      <div>Approval Package Phase Mock</div>
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
      currentPhaseName: "Approval Package",
      clearanceLevel: "CMS (OSORA)",
      phases: [],
      documents: [],
      demonstrationTypes: [],
      tags: [],
      medicaidId: "123456789",
    };

    render(
      <TestProvider>
        <PhaseSelector application={demonstration} workflowApplicationType="demonstration" />
      </TestProvider>
    );

    expect(getApprovalPackagePhaseFromApplication).toHaveBeenCalledWith(
      demonstration,
      expect.any(Function)
    );
  });

  it("preserves phase component internal state across re-renders", async () => {
    const user = userEvent.setup();

    // Mock phase component with internal state
    const PhaseWithState = () => {
      const [value, setValue] = React.useState("A");
      return (
        <div>
          <span>Current value: {value}</span>
          <select
            data-testid="test-select"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          >
            <option value="A">Option A</option>
            <option value="B">Option B</option>
          </select>
        </div>
      );
    };

    vi.mocked(getApprovalPackagePhaseFromApplication).mockReturnValue(<PhaseWithState />);

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
      medicaidId: "123456789",
    };

    const { rerender } = render(
      <TestProvider>
        <PhaseSelector application={demonstration} workflowApplicationType="demonstration" />
      </TestProvider>
    );

    const select = screen.getByTestId("test-select");
    expect(select).toHaveValue("A");
    expect(screen.getByText("Current value: A")).toBeInTheDocument();

    await user.selectOptions(select, "B");
    expect(select).toHaveValue("B");
    expect(screen.getByText("Current value: B")).toBeInTheDocument();

    rerender(
      <TestProvider>
        <PhaseSelector application={demonstration} workflowApplicationType="demonstration" />
      </TestProvider>
    );

    expect(select).toHaveValue("B");
    expect(screen.getByText("Current value: B")).toBeInTheDocument();
  });
});

describe("application intake phase component", () => {
  it("calls getApplicationIntakeComponentFromApplication with correct props when Approval Package is selected", async () => {
    vi.mocked(getApplicationIntakeComponentFromApplication).mockReturnValue(
      <div>Application Intake Phase Mock</div>
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
      currentPhaseName: "Application Intake",
      clearanceLevel: "CMS (OSORA)",
      phases: [],
      documents: [],
      demonstrationTypes: [],
      tags: [],
      suggestedApplicationTags: [],
      medicaidId: "123456789",
    };

    render(
      <TestProvider>
        <PhaseSelector application={demonstration} workflowApplicationType="demonstration" />
      </TestProvider>
    );

    expect(getApplicationIntakeComponentFromApplication).toHaveBeenCalledWith(
      expect.objectContaining({
        id: demonstration.id,
        suggestedApplicationTags: [],
      }),
      expect.any(Function)
    );
  });
});

describe("Approval Summary phase component", () => {
  it("calls getApprovalSummaryPhaseFromApplication with correct props when Approval Package is selected", async () => {
    vi.mocked(getApprovalSummaryPhaseFromApplication).mockReturnValue(
      <div>Application Intake Phase Mock</div>
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
      currentPhaseName: "Approval Summary",
      clearanceLevel: "CMS (OSORA)",
      phases: [],
      documents: [],
      demonstrationTypes: [],
      tags: [],
      medicaidId: "123456789",
    };

    render(
      <TestProvider>
        <PhaseSelector application={demonstration} workflowApplicationType="demonstration" />
      </TestProvider>
    );

    expect(getApprovalSummaryPhaseFromApplication).toHaveBeenCalledWith(
      demonstration,
      "demonstration"
    );
  });
});
