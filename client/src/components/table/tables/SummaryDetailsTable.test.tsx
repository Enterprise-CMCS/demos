import React from "react";
import { mockDemonstrations } from "mock-data/demonstrationMocks";
import { safeDateFormat } from "util/formatDate";
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { DEMONSTRATION_SUMMARY_DETAILS_QUERY, SummaryDetailsTable } from "./SummaryDetailsTable";
import { MockedProvider } from "@apollo/client/testing";

const demonstrationDetailMock = {
  request: {
    query: DEMONSTRATION_SUMMARY_DETAILS_QUERY,
    variables: { id: "1" },
  },
  result: {
    data: {
      demonstration: mockDemonstrations[0],
    },
  },
};

async function renderSummaryDetailsTable() {
  render(
    <MockedProvider mocks={[demonstrationDetailMock]}>
      <SummaryDetailsTable demonstrationId="1" />
    </MockedProvider>
  );
  await waitFor(() => {
    expect(screen.getByText("State/Territory")).toBeInTheDocument();
  });
}

describe("SummaryDetailsTable", () => {
  const testDemo = mockDemonstrations[0];

  beforeEach(async () => {
    await renderSummaryDetailsTable();
  });

  describe("Component Rendering", () => {
    it("renders the summary details table with demonstration data", () => {
      expect(screen.getByText("Montana Medicaid Waiver")).toBeInTheDocument();
      expect(screen.getByText("Montana")).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Approved")).toBeInTheDocument();
      expect(screen.getByText("A demonstration project in Montana.")).toBeInTheDocument();
    });

    it("renders all field labels correctly", () => {
      expect(screen.getByText("State/Territory")).toBeInTheDocument();
      expect(screen.getByText("Demonstration (Max Limit - 128 Characters)")).toBeInTheDocument();
      expect(screen.getByText("Project Officer")).toBeInTheDocument();
      expect(screen.getByText("Status")).toBeInTheDocument();
      expect(screen.getByText("Effective Date")).toBeInTheDocument();
      expect(screen.getByText("Expiration Date")).toBeInTheDocument();
      expect(
        screen.getByText("Demonstration Description (Max Limit - 2048 Characters)")
      ).toBeInTheDocument();
    });
  });

  describe("Date Formatting", () => {
    it("formats effective and expiration dates correctly", () => {
      // Check that dates are rendered (format will depend on locale)
      const effectiveDate = safeDateFormat(testDemo.effectiveDate);
      const expirationDate = safeDateFormat(testDemo.expirationDate);

      expect(screen.getByText(effectiveDate)).toBeInTheDocument();
      expect(screen.getByText(expirationDate)).toBeInTheDocument();
    });
  });
});

describe("Loading States", () => {
  it("shows loading state initially", async () => {
    await renderSummaryDetailsTable();
    expect(screen.getByText(/loading.../i)).toBeInTheDocument();
  });
});

describe("Error States", () => {
  it("handles query errors gracefully", async () => {
    const errorMock = {
      request: {
        query: DEMONSTRATION_SUMMARY_DETAILS_QUERY,
        variables: { id: "1" },
      },
      error: new Error("Failed to load demonstration"),
    };

    render(
      <MockedProvider mocks={[errorMock]} addTypename={false}>
        <SummaryDetailsTable demonstrationId="1" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
