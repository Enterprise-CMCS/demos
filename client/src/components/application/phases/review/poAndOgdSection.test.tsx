import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { PoAndOgdSection } from "./poAndOgdSection";

describe("PoAndOgdSection", () => {
  const mockSetSectionFormData = vi.fn();
  const mockSetSectionIsExpanded = vi.fn();

  const defaultProps = {
    sectionFormData: {
      dates: {
        "OGD Approval to Share with SMEs": "",
        "Draft Approval Package to Prep": "",
        "DDME Approval Received": "",
        "State Concurrence": "",
      },
      notes: {
        "PO and OGD": "",
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
    render(<PoAndOgdSection {...defaultProps} />);
    expect(screen.getByText("PO & OGD")).toBeInTheDocument();
  });

  it("displays the description text", () => {
    render(<PoAndOgdSection {...defaultProps} />);
    expect(screen.getByText(/Record the Sign-Off for the edits End Date/i)).toBeInTheDocument();
  });

  it("renders all four date pickers", () => {
    render(<PoAndOgdSection {...defaultProps} />);
    expect(screen.getByText("OGD Approval To Share with SMEs")).toBeInTheDocument();
    expect(screen.getByText("Draft Approval Package to Prep")).toBeInTheDocument();
    expect(screen.getByText("DDME Approval Received")).toBeInTheDocument();
    expect(screen.getByText("State Concurrence")).toBeInTheDocument();
  });

  it("renders notes textarea", () => {
    render(<PoAndOgdSection {...defaultProps} />);
    const textarea = screen.getByTestId("input-po-ogd-notes");
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute("placeholder", "Enter notes...");
  });

  it("calls setSectionFormData when a date is updated", () => {
    render(<PoAndOgdSection {...defaultProps} />);
    const datepicker = screen.getByTestId("datepicker-ogc-approval-to-share-date");

    fireEvent.change(datepicker, { target: { value: "2025-01-01" } });

    expect(mockSetSectionFormData).toHaveBeenCalledWith({
      ...defaultProps.sectionFormData,
      dates: {
        ...defaultProps.sectionFormData.dates,
        "OGD Approval to Share with SMEs": "2025-01-01",
      },
    });
  });

  it("calls setSectionFormData when notes are updated", () => {
    render(<PoAndOgdSection {...defaultProps} />);
    const textarea = screen.getByTestId("input-po-ogd-notes");

    fireEvent.change(textarea, { target: { value: "Test note" } });

    expect(mockSetSectionFormData).toHaveBeenCalledWith({
      ...defaultProps.sectionFormData,
      notes: {
        "PO and OGD": "Test note",
      },
    });
  });

  it("displays existing date values", () => {
    const propsWithDates = {
      ...defaultProps,
      sectionFormData: {
        ...defaultProps.sectionFormData,
        dates: {
          "OGD Approval to Share with SMEs": "2025-01-01",
          "Draft Approval Package to Prep": "2025-01-15",
          "DDME Approval Received": "2025-02-01",
          "State Concurrence": "2025-02-15",
        },
      },
    };

    render(<PoAndOgdSection {...propsWithDates} />);
    const datepicker1 = screen.getByTestId("datepicker-ogc-approval-to-share-date");
    const datepicker2 = screen.getByTestId("datepicker-draft-approval-package-to-prep-date");
    const datepicker3 = screen.getByTestId("datepicker-ddme-approval-received-date");
    const datepicker4 = screen.getByTestId("datepicker-state-concurrence-date");

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
          "PO and OGD": "Existing note",
        },
      },
    };

    render(<PoAndOgdSection {...propsWithNotes} />);
    const textarea = screen.getByTestId("input-po-ogd-notes");
    expect(textarea).toHaveValue("Existing note");
  });

  it("displays completeness badge based on sectionIsComplete prop", () => {
    const { rerender } = render(<PoAndOgdSection {...defaultProps} />);
    expect(screen.getByText("Incomplete")).toBeInTheDocument();

    rerender(<PoAndOgdSection {...defaultProps} sectionIsComplete={true} />);
    expect(screen.getByText("Complete")).toBeInTheDocument();
  });

  it("controls expansion state via sectionIsExpanded prop", () => {
    const { rerender } = render(<PoAndOgdSection {...defaultProps} />);

    // When expanded, form fields should be visible
    expect(screen.getByTestId("input-po-ogd-notes")).toBeInTheDocument();

    // When collapsed, form fields should not be visible
    rerender(<PoAndOgdSection {...defaultProps} sectionIsExpanded={false} />);
    expect(screen.queryByTestId("input-po-ogd-notes")).not.toBeInTheDocument();
  });
});
