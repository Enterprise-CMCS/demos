import React from "react";
import { mockDemonstration } from "mock-data/demonstrationMocks";
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import {
  DEMONSTRATION_SUMMARY_DETAILS_QUERY,
  FIELD_IDS,
  SummaryDetailsTable,
} from "./SummaryDetailsTable";
import { MockedProvider } from "@apollo/client/testing";

const demonstrationDetailMock = {
  request: {
    query: DEMONSTRATION_SUMMARY_DETAILS_QUERY,
    variables: { id: "1" },
  },
  result: {
    data: {
      demonstration: mockDemonstration,
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
  beforeEach(async () => {
    await renderSummaryDetailsTable();
  });

  describe("Component Rendering", () => {
    it("renders the State/Territory field", () => {
      const field = screen.getByRole("group", { name: "State/Territory" });
      expect(field).toHaveAttribute("aria-labelledby", FIELD_IDS.state);
      expect(within(field).getByText("Montana")).toBeInTheDocument();
    });

    it("renders the Demonstration Title field", () => {
      const field = screen.getByRole("group", { name: "Demonstration Title" });
      expect(field).toHaveAttribute("aria-labelledby", FIELD_IDS.title);
      expect(within(field).getByText("Montana Medicaid Waiver")).toBeInTheDocument();
    });

    it("renders the Demonstration ID field", () => {
      const field = screen.getByRole("group", { name: "Demonstration ID" });
      expect(field).toHaveAttribute("aria-labelledby", FIELD_IDS.medicaidId);
      expect(within(field).getByText("11-W-99999/8")).toBeInTheDocument();
    });

    it("renders the CHIP ID field", () => {
      const field = screen.getByRole("group", { name: "CHIP ID" });
      expect(field).toHaveAttribute("aria-labelledby", FIELD_IDS.chipId);
      expect(within(field).getByText("11-W-99998/8")).toBeInTheDocument();
    });

    it("renders the Project Officer field", () => {
      const field = screen.getByRole("group", { name: "Project Officer" });
      expect(field).toHaveAttribute("aria-labelledby", FIELD_IDS.projectOfficer);
      expect(within(field).getByText("CMS User")).toBeInTheDocument();
    });

    it("renders the Status field", () => {
      const field = screen.getByRole("group", { name: "Status" });
      expect(field).toHaveAttribute("aria-labelledby", FIELD_IDS.status);
      expect(within(field).getByText("Approved")).toBeInTheDocument();
    });

    it("renders the Effective Date field", () => {
      const field = screen.getByRole("group", { name: "Effective Date" });
      expect(field).toHaveAttribute("aria-labelledby", FIELD_IDS.effectiveDate);
      expect(within(field).getByText("01/01/2025")).toBeInTheDocument();
    });

    it("renders the Expiration Date field", () => {
      const field = screen.getByRole("group", { name: "Expiration Date" });
      expect(field).toHaveAttribute("aria-labelledby", FIELD_IDS.expirationDate);
      expect(within(field).getByText("02/01/2025")).toBeInTheDocument();
    });

    it("renders the Demonstration Description field", () => {
      const field = screen.getByRole("group", { name: "Demonstration Description" });
      expect(field).toHaveAttribute("aria-labelledby", FIELD_IDS.description);
      expect(within(field).getByText("A demonstration project in Montana.")).toBeInTheDocument();
    });

    it("renders the SDG Division field", () => {
      const field = screen.getByRole("group", { name: "SDG Division" });
      expect(field).toHaveAttribute("aria-labelledby", FIELD_IDS.sdgDivision);
      expect(
        within(field).getByText("Division of System Reform Demonstrations")
      ).toBeInTheDocument();
    });

    it("renders the Signature Level field", () => {
      const field = screen.getByRole("group", { name: "Signature Level" });
      expect(field).toHaveAttribute("aria-labelledby", FIELD_IDS.signatureLevel);
      expect(within(field).getByText("OA")).toBeInTheDocument();
    });
  });
});

describe("Loading States", () => {
  it("shows loading state initially", () => {
    renderSummaryDetailsTable();
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
      <MockedProvider mocks={[errorMock]}>
        <SummaryDetailsTable demonstrationId="1" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
