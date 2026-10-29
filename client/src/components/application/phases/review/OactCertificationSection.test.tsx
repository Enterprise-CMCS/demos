import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { OactCertificationSection } from "./OactCertificationSection";

describe("OactCertificationSection", () => {
  const mockSetSectionFormData = vi.fn();

  const defaultProps = {
    sectionFormData: {
      dates: {
        "OACT Certification Date": "",
      },
    },
    setSectionFormData: mockSetSectionFormData,
    isComplete: false,
    isRequired: true,
    isReadonly: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the section with correct title", () => {
    render(<OactCertificationSection {...defaultProps} />);
    expect(screen.getByText("OACT Certification")).toBeInTheDocument();
  });

  it("displays the description text", () => {
    render(<OactCertificationSection {...defaultProps} />);
    expect(
      screen.getByText("Record OACT Certification for applications approved 1/1/2027 or later.")
    ).toBeInTheDocument();
  });

  it("renders the OACT Certification Date picker", () => {
    render(<OactCertificationSection {...defaultProps} />);
    expect(screen.getByText("OACT Certification Date")).toBeInTheDocument();
    expect(screen.getByTestId("datepicker-oact-certification-date")).toBeInTheDocument();
  });

  it("marks the date as required when isRequired is true", () => {
    render(<OactCertificationSection {...defaultProps} />);
    expect(screen.getByTestId("datepicker-oact-certification-date")).toBeRequired();
  });

  it("marks the date as optional when isRequired is false", () => {
    render(<OactCertificationSection {...defaultProps} isRequired={false} />);
    expect(screen.getByTestId("datepicker-oact-certification-date")).not.toBeRequired();
  });

  it("calls setSectionFormData when the date is updated", () => {
    render(<OactCertificationSection {...defaultProps} />);
    const datepicker = screen.getByTestId("datepicker-oact-certification-date");

    fireEvent.change(datepicker, { target: { value: "2027-01-05" } });

    expect(mockSetSectionFormData).toHaveBeenCalledWith({
      dates: {
        "OACT Certification Date": "2027-01-05",
      },
    });
  });

  it("displays an existing date", () => {
    render(
      <OactCertificationSection
        {...defaultProps}
        sectionFormData={{ dates: { "OACT Certification Date": "2027-01-05" } }}
      />
    );
    expect(screen.getByTestId("datepicker-oact-certification-date")).toHaveValue("2027-01-05");
  });

  it("displays completeness badge based on isComplete prop", () => {
    const { rerender } = render(<OactCertificationSection {...defaultProps} />);
    expect(screen.getByText("Incomplete")).toBeInTheDocument();

    rerender(<OactCertificationSection {...defaultProps} isComplete={true} />);
    expect(screen.getByText("Complete")).toBeInTheDocument();
  });

  it("disables the date when isReadonly is true", () => {
    render(<OactCertificationSection {...defaultProps} isReadonly={true} />);
    expect(screen.getByTestId("datepicker-oact-certification-date")).toBeDisabled();
  });
});
