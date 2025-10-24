import React from "react";

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as env from "config/env";
import { CompletenessPhase } from "./CompletenessPhase";
import { TestProvider } from "test-utils/TestProvider";
import { DocumentTableDocument } from "components/table/tables/DocumentTable";
import type { DemonstrationPhase } from "pages/DemonstrationDetail/DemonstrationDetail";

const mockMutation = vi.fn();
const mockRefetchQueries = vi.fn();

vi.mock("@apollo/client", () => ({
  gql: (strings: TemplateStringsArray) => strings,
  useMutation: () => [mockMutation],
  useApolloClient: () => ({
    refetchQueries: mockRefetchQueries,
  }),
}));

const renderWithContext = (ui: React.ReactNode) => {
  return render(<TestProvider>{ui}</TestProvider>);
};

const buildCompletenessPhase = (overrides: Partial<DemonstrationPhase> = {}): DemonstrationPhase => ({
  phaseName: "Completeness",
  phaseStatus: "Started",
  phaseDates: [],
  ...overrides,
});

const buildDocument = (overrides: Partial<DocumentTableDocument> = {}): DocumentTableDocument => ({
  id: "doc-1",
  name: "Completeness Letter",
  description: "Test document",
  documentType: "Application Completeness Letter",
  createdAt: new Date("2025-01-01T00:00:00.000Z"),
  owner: {
    person: {
      fullName: "Test Owner",
    },
  },
  ...overrides,
});

beforeEach(() => {
  vi.spyOn(env, "isLocalDevelopment").mockReturnValue(true);
  mockMutation.mockResolvedValue({});
  mockRefetchQueries.mockResolvedValue({});
});

afterEach(() => {
  vi.restoreAllMocks();
  mockMutation.mockClear();
  mockRefetchQueries.mockClear();
});

describe("CompletenessPhase", () => {
  it("disables Finish until requirements are met", () => {
    renderWithContext(
      <CompletenessPhase
        demonstrationId="demo-1"
        completenessPhase={buildCompletenessPhase()}
        applicationIntakePhaseStatus="Completed"
        documents={[]}
      />
    );

    const finishButton = screen.getByRole("button", { name: /finish/i });
    expect(finishButton).toBeDisabled();
  });

  it("enables Finish when documents and dates are provided", () => {
    const completenessPhase = buildCompletenessPhase({
      phaseDates: [
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
    });

    renderWithContext(
      <CompletenessPhase
        demonstrationId="demo-1"
        completenessPhase={completenessPhase}
        applicationIntakePhaseStatus="Completed"
        documents={[buildDocument()]}
      />
    );

    const finishButton = screen.getByRole("button", { name: /finish/i });
    expect(finishButton).toBeEnabled();
  });

  it("auto-populates start and end dates when state deemed complete date changes", () => {
    renderWithContext(
      <CompletenessPhase
        demonstrationId="demo-1"
        completenessPhase={buildCompletenessPhase()}
        applicationIntakePhaseStatus="Completed"
        documents={[buildDocument()]}
      />
    );

    const stateInput = screen.getByTestId("state-application-deemed-complete");
    fireEvent.change(stateInput, { target: { value: "2025-02-03" } });

    expect((screen.getByTestId("federal-comment-period-start") as HTMLInputElement).value).toBe(
      "2025-02-04"
    );
    expect((screen.getByTestId("federal-comment-period-end") as HTMLInputElement).value).toBe(
      "2025-03-06"
    );
  });
});
