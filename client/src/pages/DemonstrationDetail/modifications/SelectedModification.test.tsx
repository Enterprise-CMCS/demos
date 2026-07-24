import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GET_AMENDMENT_WORKFLOW_QUERY, GET_EXTENSION_WORKFLOW_QUERY } from "components/application";
import { TestProvider } from "test-utils/TestProvider";
import { SelectedModification } from "./SelectedModification";

vi.mock("./ModificationTabSideNav", () => ({
  ModificationTabSideNav: ({
    modificationItem,
  }: {
    modificationItem: { id: string; medicaidId: string; modificationType: string };
  }) => (
    <div
      data-testid="selected-modification"
      data-id={modificationItem.id}
      data-medicaid-id={modificationItem.medicaidId}
      data-modification-type={modificationItem.modificationType}
    />
  ),
}));

const workflowResult = {
  id: "modification-1",
  name: "Modification One",
  description: "Description",
  status: "Pre-Submission",
  currentPhaseName: "Concept",
  clearanceLevel: "CMS (OSORA)",
  signatureLevel: "OA",
  effectiveDate: null,
  demonstration: {
    id: "demo-1",
    status: "Approved",
    medicaidId: "11-W-00001/1",
    demonstrationTypes: [],
  },
  tags: [],
  suggestedApplicationTags: [],
  phases: [],
  documents: [],
};

describe("SelectedModification", () => {
  it.each([
    {
      modificationType: "amendment" as const,
      query: GET_AMENDMENT_WORKFLOW_QUERY,
      field: "amendment",
    },
    {
      modificationType: "extension" as const,
      query: GET_EXTENSION_WORKFLOW_QUERY,
      field: "extension",
    },
  ])("loads the selected $modificationType", async ({ modificationType, query, field }) => {
    render(
      <TestProvider
        mocks={[
          {
            request: {
              query,
              variables: { id: "modification-1" },
            },
            result: {
              data: {
                [field]: workflowResult,
              },
            },
          },
        ]}
      >
        <SelectedModification
          id="modification-1"
          medicaidId="11-W-00001/1"
          modificationType={modificationType}
        />
      </TestProvider>
    );

    const selected = await screen.findByTestId("selected-modification");
    expect(selected).toHaveAttribute("data-id", "modification-1");
    expect(selected).toHaveAttribute("data-medicaid-id", "11-W-00001/1");
    expect(selected).toHaveAttribute("data-modification-type", modificationType);
  });
});
