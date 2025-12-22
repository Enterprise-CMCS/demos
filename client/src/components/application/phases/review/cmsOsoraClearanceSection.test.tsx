import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { CmsOsoraClearanceSection } from "./cmsOsoraClearanceSection";

describe("CmsOsoraClearanceSection", () => {
  const mockSetSectionFormData = vi.fn();
  const mockSetSectionIsExpanded = vi.fn();

  const defaultProps = {
    sectionFormData: {
      dates: {
        "Submit Approval Package to OSORA": "",
        "OSORA R1 Comments Due": "",
        "OSORA R2 Comments Due": "",
        "CMS (OSORA) Clearance End": "",
      },
      notes: {
        "CMS (OSORA) Clearance": "",
      },
    },
    setSectionFormData: mockSetSectionFormData,
    sectionIsComplete: false,
    sectionIsExpanded: true,
    setSectionIsExpanded: mockSetSectionIsExpanded,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the section with correct title", () => {
    render(<CmsOsoraClearanceSection {...defaultProps} />);
    expect(screen.getByText("CMS (OSORA) Clearance")).toBeInTheDocument();
  });

  it("displays the description text", () => {
    render(<CmsOsoraClearanceSection {...defaultProps} />);
    expect(screen.getByText(/Demonstrations with the highest Scruteny/i)).toBeInTheDocument();
  });

  it("renders all four date pickers", () => {
    render(<CmsOsoraClearanceSection {...defaultProps} />);
    expect(screen.getByText("Submit Approval Package to OSORA")).toBeInTheDocument();
    expect(screen.getByText("OSORA R1 Comments Due")).toBeInTheDocument();
    expect(screen.getByText("OSORA R2 Comments Due")).toBeInTheDocument();
    expect(screen.getByText("CMS (OSORA) Clearance End")).toBeInTheDocument();
  });

  it("renders notes textarea", () => {
    render(<CmsOsoraClearanceSection {...defaultProps} />);
    const textarea = screen.getByTestId("input-cms-osora-notes");
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute("placeholder", "Enter notes...");
  });

  it("calls setSectionFormData when a date is updated", () => {
    render(<CmsOsoraClearanceSection {...defaultProps} />);
    const datepicker = screen.getByTestId("datepicker-submit-approval-package-to-osora");

    fireEvent.change(datepicker, { target: { value: "2025-01-01" } });

    expect(mockSetSectionFormData).toHaveBeenCalledWith({
      ...defaultProps.sectionFormData,
      dates: {
        ...defaultProps.sectionFormData.dates,
        "Submit Approval Package to OSORA": "2025-01-01",
      },
    });
  });

  it("calls setSectionFormData when notes are updated", () => {
    render(<CmsOsoraClearanceSection {...defaultProps} />);
    const textarea = screen.getByTestId("input-cms-osora-notes");

    fireEvent.change(textarea, { target: { value: "Test note" } });

    expect(mockSetSectionFormData).toHaveBeenCalledWith({
      ...defaultProps.sectionFormData,
      notes: {
        "CMS (OSORA) Clearance": "Test note",
      },
    });
  });

  it("displays existing date values", () => {
    const propsWithDates = {
      ...defaultProps,
      sectionFormData: {
        ...defaultProps.sectionFormData,
        dates: {
          "Submit Approval Package to OSORA": "2025-01-01",
          "OSORA R1 Comments Due": "2025-01-15",
          "OSORA R2 Comments Due": "2025-01-30",
          "CMS (OSORA) Clearance End": "2025-02-01",
        },
      },
    };

    render(<CmsOsoraClearanceSection {...propsWithDates} />);
    expect(screen.getByTestId("datepicker-submit-approval-package-to-osora")).toHaveValue(
      "2025-01-01"
    );
    expect(screen.getByTestId("datepicker-osora-r1-comments-due-date")).toHaveValue("2025-01-15");
    expect(screen.getByTestId("datepicker-osora-r2-comments-due-date")).toHaveValue("2025-01-30");
    expect(screen.getByTestId("datepicker-cms-osora-clearance-end-date")).toHaveValue("2025-02-01");
  });

  it("displays existing notes value", () => {
    const propsWithNotes = {
      ...defaultProps,
      sectionFormData: {
        ...defaultProps.sectionFormData,
        notes: {
          "CMS (OSORA) Clearance": "Existing note",
        },
      },
    };

    render(<CmsOsoraClearanceSection {...propsWithNotes} />);
    const textarea = screen.getByTestId("input-cms-osora-notes");
    expect(textarea).toHaveValue("Existing note");
  });

  it("displays completeness badge based on sectionIsComplete prop", () => {
    const { rerender } = render(<CmsOsoraClearanceSection {...defaultProps} />);
    expect(screen.getByText("Incomplete")).toBeInTheDocument();

    rerender(<CmsOsoraClearanceSection {...defaultProps} sectionIsComplete={true} />);
    expect(screen.getByText("Complete")).toBeInTheDocument();
  });
});
