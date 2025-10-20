import React from "react";

import { TestProvider } from "test-utils/TestProvider";
import { describe, expect, it } from "vitest";

import { render, screen } from "@testing-library/react";

import { PhaseSelector } from "./PhaseSelector";

describe("PhaseSelector", () => {
  it("renders all phase names", () => {
    const demonstration = {
      id: "fcf8d9f9-03ff-4092-b784-937a760e5f5b",
      name: "decretum sortitus strues",
      description: "Defendo via delibero vitae umquam sufficio bestia.",
      effectiveDate: "2026-07-18T00:00:00.000Z",
      expirationDate: "2026-03-27T00:00:00.000Z",
      state: {
        id: "OR",
        name: "Oregon",
      },
      status: "Under Review" as const,
      projectOfficer: {
        fullName: "Virginia McClure",
      },
      amendments: [],
      extensions: [],
      documents: [
        {
          id: "db013f55-734c-4863-92d0-322bbbd72d55",
          title: "Curatio valeo.",
          description: "Application for Curatio valeo.",
          documentType: {
            id: "State Application",
          },
          createdAt: "2025-09-19T18:05:41.071Z",
          owner: {
            fullName: "Marion Bergnaum",
          },
        },
      ],
      contacts: [
        {
          id: "1",
          fullName: "John Doe",
          email: "john.doe@email.com",
          contactType: "Project Officer",
        },
      ],
      currentPhaseName: "Federal Comment" as const,
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
