import React from "react";

import { DocumentType } from "demos-server";
import { DOCUMENT_TYPES } from "demos-server-constants";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DocumentTypeInput } from "./DocumentTypeInput";

describe("DocumentTypeInput", () => {
  const mockOnSelect = vi.fn();
  const defaultProps = {
    value: "",
    onSelect: mockOnSelect,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with the correct value when provided", () => {
    const value = "General File";
    render(<DocumentTypeInput {...defaultProps} value={value} />);

    const input = screen.getByDisplayValue(value);
    expect(input).toBeInTheDocument();
  });

  it("shows all document types in dropdown when clicked", async () => {
    const user = userEvent.setup();
    render(<DocumentTypeInput {...defaultProps} />);

    const input = screen.getByTestId("input-autocomplete-select");
    await user.click(input);

    // Check that all document types from DOCUMENT_TYPES are present
    for (const documentType of DOCUMENT_TYPES) {
      expect(screen.getByText(documentType)).toBeInTheDocument();
    }
  });

  it("calls onSelect when an option is selected", async () => {
    const user = userEvent.setup();
    render(<DocumentTypeInput {...defaultProps} />);

    const input = screen.getByTestId("input-autocomplete-select");
    await user.click(input);

    const option = screen.getByText("Approval Letter");
    await user.click(option);

    expect(mockOnSelect).toHaveBeenCalledWith("Approval Letter");
  });

  it("accepts a subset of document types", async () => {
    const user = userEvent.setup();
    const documentTypeSubset: DocumentType[] = ["General File", "Approval Letter"];

    render(<DocumentTypeInput {...defaultProps} documentTypeSubset={documentTypeSubset} />);

    const input = screen.getByTestId("input-autocomplete-select");
    await user.click(input);

    // Should only show the subset
    expect(screen.getByText("General File")).toBeInTheDocument();
    expect(screen.getByText("Approval Letter")).toBeInTheDocument();

    // Should not show types not in the subset
    expect(screen.queryByText("Q&A")).not.toBeInTheDocument();
    expect(screen.queryByText("Pre-Submission")).not.toBeInTheDocument();
  });

  it("handles empty documentTypeSubset gracefully", async () => {
    const user = userEvent.setup();
    const documentTypeSubset: DocumentType[] = [];

    render(<DocumentTypeInput {...defaultProps} documentTypeSubset={documentTypeSubset} />);

    const input = screen.getByTestId("input-autocomplete-select");
    await user.click(input);

    // Should show no options when subset is empty
    expect(screen.queryByText("General File")).not.toBeInTheDocument();
    expect(screen.queryByText("Approval Letter")).not.toBeInTheDocument();
  });

  it("disables the field and prevents onSelect callback when canEditDocumentType is false", async () => {
    const user = userEvent.setup();
    render(<DocumentTypeInput {...defaultProps} canEditDocumentType={false} />);

    const input = screen.getByTestId("input-autocomplete-select");

    // 1. The field should be disabled
    expect(input).toBeDisabled();

    // Remove the disabled attribute to simulate bypassing the disabled state
    input.removeAttribute("disabled");

    // Try to open the dropdown and select an option
    await user.click(input);

    const option = screen.queryByText("Approval Letter");
    if (option) {
      await user.click(option);
    }

    // 2. The callback should still not be called even if disabled attribute is removed
    expect(mockOnSelect).not.toHaveBeenCalled();
  });
});
