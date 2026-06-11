import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { CommsClearanceSection } from "./commsClearanceSection";

describe("CommsClearanceSection", () => {
  const mockSetSectionFormData = vi.fn();

  const defaultProps = {
    sectionFormData: {
      dates: {
        "Package Sent for COMMs Clearance": "",
        "COMMs Clearance Received": "",
      },
      notes: {
        "COMMs Clearance": "",
      },
    },
    setSectionFormData: mockSetSectionFormData,
    isComplete: false,
    isReadonly: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the section with correct title", () => {
    render(<CommsClearanceSection {...defaultProps} />);
    expect(screen.getByText("Comms Clearance")).toBeInTheDocument();
  });

  it("displays the description text", () => {
    render(<CommsClearanceSection {...defaultProps} />);
    expect(
      screen.getByText(/OCD Signature and COMMs Clearance are minimal requirements/i)
    ).toBeInTheDocument();
  });

  it("renders both date pickers", () => {
    render(<CommsClearanceSection {...defaultProps} />);
    expect(screen.getByText("Package Sent for COMMs Clearance")).toBeInTheDocument();
    expect(screen.getByText("COMMs Clearance Received")).toBeInTheDocument();
  });

  it("renders notes textarea", () => {
    render(<CommsClearanceSection {...defaultProps} />);
    const textarea = screen.getByTestId("input-comms-clearance-notes");
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute("placeholder", "Enter notes...");
  });

  it("calls setSectionFormData when a date is updated", () => {
    render(<CommsClearanceSection {...defaultProps} />);
    const datepicker = screen.getByTestId("datepicker-package-sent-for-comms-clearance-date");

    fireEvent.change(datepicker, { target: { value: "2025-01-01" } });

    expect(mockSetSectionFormData).toHaveBeenCalledWith({
      ...defaultProps.sectionFormData,
      dates: {
        ...defaultProps.sectionFormData.dates,
        "Package Sent for COMMs Clearance": "2025-01-01",
      },
    });
  });

  it("calls setSectionFormData when notes are updated", () => {
    render(<CommsClearanceSection {...defaultProps} />);
    const textarea = screen.getByTestId("input-comms-clearance-notes");

    fireEvent.change(textarea, { target: { value: "Test note" } });

    expect(mockSetSectionFormData).toHaveBeenCalledWith({
      ...defaultProps.sectionFormData,
      notes: {
        "COMMs Clearance": "Test note",
      },
    });
  });

  it("displays existing date values", () => {
    const propsWithDates = {
      ...defaultProps,
      sectionFormData: {
        ...defaultProps.sectionFormData,
        dates: {
          "Package Sent for COMMs Clearance": "2025-02-01",
          "COMMs Clearance Received": "2025-02-15",
        },
      },
    };

    render(<CommsClearanceSection {...propsWithDates} />);
    const datepicker1 = screen.getByTestId("datepicker-package-sent-for-comms-clearance-date");
    const datepicker2 = screen.getByTestId("datepicker-comms-clearance-received-date");

    expect(datepicker1).toHaveValue("2025-02-01");
    expect(datepicker2).toHaveValue("2025-02-15");
  });

  it("displays existing notes value", () => {
    const propsWithNotes = {
      ...defaultProps,
      sectionFormData: {
        ...defaultProps.sectionFormData,
        notes: {
          "COMMs Clearance": "Existing note",
        },
      },
    };

    render(<CommsClearanceSection {...propsWithNotes} />);
    const textarea = screen.getByTestId("input-comms-clearance-notes");
    expect(textarea).toHaveValue("Existing note");
  });

  it("displays completeness badge based on isComplete prop", () => {
    const { rerender } = render(<CommsClearanceSection {...defaultProps} />);
    expect(screen.getByText("Incomplete")).toBeInTheDocument();

    rerender(<CommsClearanceSection {...defaultProps} isComplete={true} />);
    expect(screen.getByText("Complete")).toBeInTheDocument();
  });

  describe("Readonly", () => {
    it("disables all date inputs when isReadonly is true", () => {
      render(<CommsClearanceSection {...defaultProps} isReadonly={true} />);

      expect(screen.getByTestId("datepicker-package-sent-for-comms-clearance-date")).toBeDisabled();
      expect(screen.getByTestId("datepicker-comms-clearance-received-date")).toBeDisabled();
    });

    it("disables notes textarea when isReadonly is true", () => {
      render(<CommsClearanceSection {...defaultProps} isReadonly={true} />);

      const textarea = screen.getByTestId("input-comms-clearance-notes");
      expect(textarea).toBeDisabled();
    });
  });
});
