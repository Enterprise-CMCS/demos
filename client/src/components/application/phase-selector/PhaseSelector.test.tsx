import React from "react";

import { TestProvider } from "test-utils/TestProvider";
import { describe, expect, it } from "vitest";

import { render, screen } from "@testing-library/react";

import { PhaseSelector } from "./PhaseSelector";

describe("PhaseSelector", () => {
  it("renders all phase names", () => {
    const demonstration = {
      id: "fcf8d9f9-03ff-4092-b784-937a760e5f5b",
      status: "Under Review" as const,
      phases: [
        {
          phaseName: "Concept" as const,
          phaseStatus: "Completed" as const,
          phaseDates: [
            { dateType: "Concept Start Date", dateValue: new Date("2025-01-01T00:00:00.000Z") },
            {
              dateType: "Concept Completion Date",
              dateValue: new Date("2025-01-16T00:00:00.000Z"),
            },
          ],
        },
        {
          phaseName: "Application Intake" as const,
          phaseStatus: "Completed" as const,
          phaseDates: [
            {
              dateType: "Application Intake Start Date",
              dateValue: new Date("2025-01-16T00:00:00.000Z"),
            },
            {
              dateType: "Application Intake Completion Date",
              dateValue: new Date("2025-01-24T00:00:00.000Z"),
            },
          ],
        },
        {
          phaseName: "Completeness" as const,
          phaseStatus: "Started" as const,
          phaseDates: [
            {
              dateType: "Completeness Start Date",
              dateValue: new Date("2025-01-24T00:00:00.000Z"),
            },
            {
              dateType: "State Application Deemed Complete",
              dateValue: new Date("2025-02-03T00:00:00.000Z"),
            },
            {
              dateType: "Federal Comment Period Start Date",
              dateValue: new Date("2025-02-04T00:00:00.000Z"),
            },
            {
              dateType: "Federal Comment Period End Date",
              dateValue: new Date("2025-03-05T23:59:59.999Z"),
            },
          ],
        },
        {
          phaseName: "Federal Comment" as const,
          phaseStatus: "Not Started" as const,
          phaseDates: [
            {
              dateType: "Federal Comment Period Start Date",
              dateValue: new Date("2025-02-04T00:00:00.000Z"),
            },
            {
              dateType: "Federal Comment Period End Date",
              dateValue: new Date("2025-03-05T23:59:59.999Z"),
            },
          ],
        },
      ],
      documents: [
        {
          id: "db013f55-734c-4863-92d0-322bbbd72d55",
          name: "Curatio valeo.",
          description: "Application for Curatio valeo.",
          documentType: "Application Completeness Letter" as const,
          createdAt: new Date("2025-09-19T18:05:41.071Z"),
          owner: {
            person: {
              fullName: "Marion Bergnaum",
            },
          },
        },
      ],
      currentPhaseName: "Completeness" as const,
    } satisfies Parameters<typeof PhaseSelector>[0]["demonstration"];

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
