import React from "react";

import { ToastProvider } from "components/toast/ToastContext";
import { vi } from "vitest";

import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import { CreateNewModal } from "./CreateNewModal";

if (!HTMLFormElement.prototype.requestSubmit) {
  HTMLFormElement.prototype.requestSubmit = function () {
    // If form validation fails, prevent dispatching submit
    if (!this.checkValidity()) {
      const invalidEvent = new Event("invalid", { bubbles: true, cancelable: true });
      this.dispatchEvent(invalidEvent);
      return;
    }

    this.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
  };
}

const renderModal = () => {
  const onSubmit = vi.fn().mockImplementation(() => Promise.resolve());
  const onClose = vi.fn();

  render(
    <ToastProvider>
      <CreateNewModal
        onClose={onClose}
        onSubmit={onSubmit}
      />
    </ToastProvider>
  );

  return { onSubmit, onClose };
};

const fillForm = async () => {
  fireEvent.change(screen.getByLabelText(/State\/Territory/i), { target: { value: "CA" } });
  fireEvent.change(screen.getByLabelText(/Demonstration Title/i), { target: { value: "Test Demo" } });
  fireEvent.change(screen.getByLabelText(/Project Officer/i), { target: { value: "user1" } });
  fireEvent.change(screen.getByLabelText(/Effective Date/i), { target: { value: "2024-06-20" } });
  fireEvent.change(screen.getByLabelText(/Expiration Date/i), { target: { value: "2024-07-20" } });
  fireEvent.change(screen.getByLabelText(/Demonstration Description/i), { target: { value: "Test description" } });
};


describe("CreateNewModal", () => {
  it("renders modal title correctly", () => {
    renderModal();
    expect(screen.getByText("New Demonstration")).toBeInTheDocument();
  });

  it("opens cancel confirmation when clicking Cancel button", () => {
    renderModal();
    fireEvent.click(screen.getByText("Cancel"));
    expect(
      screen.getByText("Are you sure you want to cancel?")
    ).toBeInTheDocument();
  });

  it("closes modal when clicking Yes in cancel confirmation", () => {
    const { onClose } = renderModal();
    fireEvent.click(screen.getByText("Cancel"));
    fireEvent.click(screen.getByText("Yes"));
    expect(onClose).toHaveBeenCalled();
  });

  it("dismisses cancel confirmation when clicking No", () => {
    renderModal();
    fireEvent.click(screen.getByText("Cancel"));
    fireEvent.click(screen.getByText("No"));
    expect(
      screen.queryByText("Are you sure you want to cancel?")
    ).not.toBeInTheDocument();
  });

  it("validates expiration date cannot be before effective date", async () => {
    renderModal();
    const effectiveDate = screen.getByLabelText(/Effective Date/i);
    const expirationDate = screen.getByLabelText(/Expiration Date/i);

    fireEvent.change(effectiveDate, { target: { value: "2024-06-20" } });
    fireEvent.change(expirationDate, { target: { value: "2024-06-19" } });

    await waitFor(() => {
      expect(
        screen.getByText("Expiration Date cannot be before Effective Date.")
      ).toBeInTheDocument();
    });
  });

  it("clears expiration date when effective date is changed to after expiration date", async () => {
    renderModal();
    const effectiveDate = screen.getByLabelText(/Effective Date/i);
    const expirationDate = screen.getByLabelText(/Expiration Date/i);

    fireEvent.change(effectiveDate, { target: { value: "2024-06-20" } });
    fireEvent.change(expirationDate, { target: { value: "2024-06-21" } });
    fireEvent.change(effectiveDate, { target: { value: "2024-06-22" } });

    await waitFor(() => {
      expect(expirationDate).toHaveValue("");
    });
  });
});
