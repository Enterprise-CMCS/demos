import React from "react";

import { TestProvider } from "test-utils/TestProvider";
import { describe, expect, it } from "vitest";

import { render, screen } from "@testing-library/react";

import { PhaseSelector, getDisplayedPhaseStatus, getDisplayedPhaseDate } from "./PhaseSelector";
import { ApplicationWorkflowDemonstration } from "../ApplicationWorkflow";

describe("PhaseSelector", () => {
  it("renders all phase names", () => {
    const demonstration: ApplicationWorkflowDemonstration = {
      id: "fcf8d9f9-03ff-4092-b784-937a760e5f5b",
      status: "Under Review",
      currentPhaseName: "Federal Comment",
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
      "OGC & OMB Review",
      "Approval Package",
      "Post Approval",
    ].forEach((name) => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });
  });
});

describe("getDisplayedPhaseStatus", () => {
  it("returns the phase status when phase exists", () => {
    const demonstration: ApplicationWorkflowDemonstration = {
      id: "test-id",
      status: "Under Review",
      currentPhaseName: "Concept",
      phases: [
        {
          phaseName: "Concept",
          phaseStatus: "Started",
          phaseDates: [],
        },
        {
          phaseName: "Application Intake",
          phaseStatus: "Completed",
          phaseDates: [],
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
      status: "Under Review",
      currentPhaseName: "Concept",
      phases: [
        {
          phaseName: "Concept",
          phaseStatus: "Started",
          phaseDates: [],
        },
      ],
      documents: [],
    };

    expect(getDisplayedPhaseStatus(demonstration, "Completeness")).toBe("Not Started");
  });

  it("returns 'Not Started' when phases array is empty", () => {
    const demonstration: ApplicationWorkflowDemonstration = {
      id: "test-id",
      status: "Under Review",
      currentPhaseName: "Concept",
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
      status: "Under Review",
      currentPhaseName: "Concept",
      phases: [],
      documents: [],
    };

    expect(getDisplayedPhaseDate(demonstration, "Concept")).toBeUndefined();
  });

  it("returns undefined when phase has no dates", () => {
    const demonstration: ApplicationWorkflowDemonstration = {
      id: "test-id",
      status: "Under Review",
      currentPhaseName: "Concept",
      phases: [
        {
          phaseName: "Concept",
          phaseStatus: "Started",
          phaseDates: [],
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
      status: "Under Review",
      currentPhaseName: "Concept",
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
      status: "Under Review",
      currentPhaseName: "OGC & OMB Review",
      phases: [
        {
          phaseName: "OGC & OMB Review",
          phaseStatus: "Completed",
          phaseDates: [
            {
              dateType: "OGC & OMB Review Start Date",
              dateValue: startDate,
            },
            {
              dateType: "OGC Review Complete",
              dateValue: completeDate,
            },
          ],
        },
      ],
      documents: [],
    };

    const result = getDisplayedPhaseDate(demonstration, "OGC & OMB Review");
    expect(result).toEqual(completeDate);
  });

  it("falls back to submitted dates when no completion date exists", () => {
    const submittedDate = new Date("2025-02-20");
    const startDate = new Date("2025-01-10");

    const demonstration: ApplicationWorkflowDemonstration = {
      id: "test-id",
      status: "Under Review",
      currentPhaseName: "Application Intake",
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
      status: "Under Review",
      currentPhaseName: "Federal Comment",
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
      status: "Under Review",
      currentPhaseName: "SDG Preparation",
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
      status: "Under Review",
      currentPhaseName: "Concept",
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
        },
      ],
      documents: [],
    };

    const result = getDisplayedPhaseDate(demonstration, "Concept");
    expect(result).toBeInstanceOf(Date);
    expect(result).toEqual(dateValue);
  });
});
