import React from "react";

import { formatDate } from "util/formatDate";
import { beforeEach, describe, expect, it } from "vitest";

import { render, screen } from "@testing-library/react";

import { SummaryDetailsTable } from "./SummaryDetailsTable";
import { mockDemonstrations } from "mock-data/demonstrationMocks";

describe("SummaryDetailsTable", () => {
  beforeEach(() => {
    render(<SummaryDetailsTable demonstration={mockDemonstrations[0]} />);
  });
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

  it("formats effective and expiration dates correctly", () => {
    // Check that dates are rendered (format will depend on locale)
    const effectiveDate = formatDate(mockDemonstrations[0].effectiveDate);
    const expirationDate = formatDate(mockDemonstrations[0].expirationDate);

    expect(screen.getByText(effectiveDate)).toBeInTheDocument();
    expect(screen.getByText(expirationDate)).toBeInTheDocument();
  });
});
