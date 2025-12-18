import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { OgcAndOmbSection } from "./ogcAndOmbSection";

describe("OgcAndOmbSection", () => {
  const mockSetSectionFormData = vi.fn();
  const mockSetSectionIsExpanded = vi.fn();

  const defaultProps = {
    sectionFormData: {
      dates: {
        "BN PMT Approval to Send to OMB": "",
        "Draft Approval Package Shared": "",
        "Receive OMB Concurrence": "",
        "Receive OGC Legal Clearance": "",
      },
      notes: {
        "OGC and OMB": "",
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
    render(<OgcAndOmbSection {...defaultProps} />);
    expect(screen.getByText("OGC & OMB")).toBeInTheDocument();
  });

  it("displays the description text", () => {
    render(<OgcAndOmbSection {...defaultProps} />);
    expect(screen.getByText(/Record the OGC & OMB Review Process/i)).toBeInTheDocument();
  });

  it("renders all four date pickers", () => {
    render(<OgcAndOmbSection {...defaultProps} />);
    expect(screen.getByText("BN PMT Approval to Send to OMB")).toBeInTheDocument();
    expect(screen.getByText("Draft Approval Package Shared")).toBeInTheDocument();
    expect(screen.getByText("Receive OMB Concurrence")).toBeInTheDocument();
    expect(screen.getByText("Receive OGC Legal Clearance")).toBeInTheDocument();
  });

  it("renders notes textarea", () => {
    render(<OgcAndOmbSection {...defaultProps} />);
    const textarea = screen.getByTestId("input-ogc-omb-notes");
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute("placeholder", "Enter notes...");
  });

  it("calls setSectionFormData when a date is updated", () => {
    render(<OgcAndOmbSection {...defaultProps} />);
    const datepicker = screen.getByTestId("datepicker-bn-pmt-approval-received-date");

    fireEvent.change(datepicker, { target: { value: "2025-01-01" } });

    expect(mockSetSectionFormData).toHaveBeenCalledWith({
      ...defaultProps.sectionFormData,
      dates: {
        ...defaultProps.sectionFormData.dates,
        "BN PMT Approval to Send to OMB": "2025-01-01",
      },
    });
  });

  it("calls setSectionFormData when notes are updated", () => {
    render(<OgcAndOmbSection {...defaultProps} />);
    const textarea = screen.getByTestId("input-ogc-omb-notes");

    fireEvent.change(textarea, { target: { value: "Test note" } });

    expect(mockSetSectionFormData).toHaveBeenCalledWith({
      ...defaultProps.sectionFormData,
      notes: {
        "OGC and OMB": "Test note",
      },
    });
  });

  it("displays existing date values", () => {
    const propsWithDates = {
      ...defaultProps,
      sectionFormData: {
        ...defaultProps.sectionFormData,
        dates: {
          "BN PMT Approval to Send to OMB": "2025-01-01",
          "Draft Approval Package Shared": "2025-01-15",
          "Receive OMB Concurrence": "2025-02-01",
          "Receive OGC Legal Clearance": "2025-02-15",
        },
      },
    };

    render(<OgcAndOmbSection {...propsWithDates} />);
    const datepicker1 = screen.getByTestId("datepicker-bn-pmt-approval-received-date");
    const datepicker2 = screen.getByTestId("datepicker-draft-approval-package-shared-date");
    const datepicker3 = screen.getByTestId("datepicker-receive-omb-concurrence-date");
    const datepicker4 = screen.getByTestId("datepicker-receive-ogc-legal-clearance-date");

    expect(datepicker1).toHaveValue("2025-01-01");
    expect(datepicker2).toHaveValue("2025-01-15");
    expect(datepicker3).toHaveValue("2025-02-01");
    expect(datepicker4).toHaveValue("2025-02-15");
  });

  it("displays existing notes value", () => {
    const propsWithNotes = {
      ...defaultProps,
      sectionFormData: {
        ...defaultProps.sectionFormData,
        notes: {
          "OGC and OMB": "Existing note",
        },
      },
    };

    render(<OgcAndOmbSection {...propsWithNotes} />);
    const textarea = screen.getByTestId("input-ogc-omb-notes");
    expect(textarea).toHaveValue("Existing note");
  });

  it("displays completeness badge based on sectionIsComplete prop", () => {
    const { rerender } = render(<OgcAndOmbSection {...defaultProps} />);
    expect(screen.getByText("Incomplete")).toBeInTheDocument();

    rerender(<OgcAndOmbSection {...defaultProps} sectionIsComplete={true} />);
    expect(screen.getByText("Complete")).toBeInTheDocument();
  });

  it("controls expansion state via sectionIsExpanded prop", () => {
    const { rerender } = render(<OgcAndOmbSection {...defaultProps} />);

    // When expanded, form fields should be visible
    expect(screen.getByTestId("input-ogc-omb-notes")).toBeInTheDocument();

    // When collapsed, form fields should not be visible
    rerender(<OgcAndOmbSection {...defaultProps} sectionIsExpanded={false} />);
    expect(screen.queryByTestId("input-ogc-omb-notes")).not.toBeInTheDocument();
  });
});
