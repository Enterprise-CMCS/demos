import React from "react";

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import { CreateNewModal } from "./CreateNewModal";

// Helper to open the cancel confirmation
const openCancelConfirmation = () => {
  const cancelBtn = screen.getByText("Cancel");
  fireEvent.click(cancelBtn);
};

describe("CreateNewModal", () => {
  let onClose: () => void;

  beforeEach(() => {
    onClose = vi.fn();
    render(<CreateNewModal onClose={onClose} />);
  });

  it("renders modal title correctly", () => {
    expect(screen.getByText("New Demonstration")).toBeInTheDocument();
  });

  it("opens cancel confirmation when clicking Cancel button", () => {
    openCancelConfirmation();
    expect(screen.getByText("Are you sure you want to cancel?")).toBeInTheDocument();
  });

  it("closes modal when clicking Yes in cancel confirmation", () => {
    openCancelConfirmation();
    const yesBtn = screen.getByText("Yes");
    fireEvent.click(yesBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it("validates expiration date cannot be before effective date", () => {
    const effectiveDateInput = screen.getByLabelText("Effective Date");
    const expirationDateInput = screen.getByLabelText("Expiration Date");

    fireEvent.change(effectiveDateInput, { target: { value: "2024-06-15" } });
    fireEvent.change(expirationDateInput, { target: { value: "2024-06-10" } });

    expect(screen.getByText("Expiration Date cannot be before Effective Date.")).toBeInTheDocument();
  });

  it("displays success message after successful submission", async () => {
    // Fill out minimal required fields
    fireEvent.change(screen.getByLabelText("*State/Territory"), { target: { value: "PA" } });
    fireEvent.change(screen.getByLabelText("*Demonstration Title"), { target: { value: "Test Title" } });
    fireEvent.change(screen.getByLabelText("*Project Officer"), { target: { value: "John Doe" } });
    fireEvent.change(screen.getByLabelText("Effective Date"), { target: { value: "2024-06-20" } });
    fireEvent.change(screen.getByLabelText("Expiration Date"), { target: { value: "2024-06-30" } });

    // Mock timer for simulated API delay
    vi.useFakeTimers();

    const submitBtn = screen.getByText("Submit");
    fireEvent.click(submitBtn);

    // Fast forward timer
    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(screen.getByText("Demonstration created successfully. (Placeholder Message)")).toBeInTheDocument();
    });

    vi.useRealTimers();
  });
})
