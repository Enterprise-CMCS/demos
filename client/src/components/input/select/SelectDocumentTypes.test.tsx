import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { DOCUMENT_TYPES } from "demos-server-constants";
import { SelectDocumentTypes } from "./SelectDocumentTypes";

describe("SelectDocumentTypes", () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with the correct value when provided", () => {
    const value = "General File";
    render(<SelectDocumentTypes onChange={mockOnChange} value={value} />);

    const input = screen.getByDisplayValue(value);
    expect(input).toBeInTheDocument();
  });

  it("shows all document types in dropdown when clicked", async () => {
    const user = userEvent.setup();
    render(<SelectDocumentTypes onChange={mockOnChange} />);

    const input = screen.getByLabelText("Document Type");
    await user.click(input);

    // Check that all document types from DOCUMENT_TYPES are present
    for (const documentType of DOCUMENT_TYPES) {
      expect(screen.getByText(documentType)).toBeInTheDocument();
    }
  });

  it("calls onSelect when an option is selected", async () => {
    const user = userEvent.setup();
    render(<SelectDocumentTypes onChange={mockOnChange} />);

    const input = screen.getByLabelText("Document Type");
    await user.click(input);

    const option = screen.getByText("Approval Letter");
    await user.click(option);

    expect(mockOnChange).toHaveBeenCalledWith("Approval Letter");
  });
});
