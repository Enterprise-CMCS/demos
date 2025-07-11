import React from "react";

import { ToastProvider } from "components/toast/ToastContext";
import { vi } from "vitest";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { CreateNewModal } from "./CreateNewModal";

// Mock the useDemonstration hook
vi.mock("hooks/useDemonstration", () => ({
  useDemonstration: vi.fn(() => ({
    addDemonstration: {
      trigger: vi.fn().mockResolvedValue({
        data: { addDemonstration: { id: "1", name: "Test Demo" } },
      }),
      data: undefined,
      loading: false,
      error: undefined,
    },
    updateDemonstration: {
      trigger: vi.fn().mockResolvedValue({
        data: { updateDemonstration: { id: "1", name: "Updated Demo" } },
      }),
      data: undefined,
      loading: false,
      error: undefined,
    },
  })),
}));


// Mock the SelectUSAStates component
vi.mock("components/input/select/SelectUSAStates", () => ({
  SelectUSAStates: ({
    label,
    onStateChange,
  }: {
    label: string;
    onStateChange: (state: string) => void;
  }) => (
    <div>
      <label>{label}</label>
      <select
        data-testid="state-select"
        onChange={(e) => onStateChange(e.target.value)}
      >
        <option value="">Select a state</option>
        <option value="1">California</option>
        <option value="2">Texas</option>
      </select>
    </div>
  ),
}));

// Mock the SelectUsers component
vi.mock("components/input/select/SelectUsers", () => ({
  SelectUsers: ({
    label,
    onStateChange,
  }: {
    label: string;
    onStateChange: (user: string) => void;
  }) => (
    <div>
      <label>{label}</label>
      <select
        data-testid="user-select"
        onChange={(e) => onStateChange(e.target.value)}
      >
        <option value="">Select a user</option>
        <option value="1">John Doe</option>
        <option value="2">Jane Smith</option>
      </select>
    </div>
  ),
}));

if (!HTMLFormElement.prototype.requestSubmit) {
  HTMLFormElement.prototype.requestSubmit = function () {
    // If form validation fails, prevent dispatching submit
    if (!this.checkValidity()) {
      const invalidEvent = new Event("invalid", {
        bubbles: true,
        cancelable: true,
      });
      this.dispatchEvent(invalidEvent);
      return;
    }

    this.dispatchEvent(
      new SubmitEvent("submit", { bubbles: true, cancelable: true })
    );
  };
}

const renderModal = ({
  mode = "add",
  demonstration,
}: {
  mode?: "add" | "edit";
  demonstration?: any;
} = {}) => {
  const onClose = vi.fn();

  render(
    <ToastProvider>
      <CreateNewModal mode={mode} onClose={onClose} demonstration={demonstration} />
    </ToastProvider>
  );

  return { onClose };
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

  it("submits form with valid data", async () => {
    const { useDemonstration } = await import("hooks/useDemonstration");
    const mockTrigger = vi.fn().mockResolvedValue({
      data: { addDemonstration: { id: "1", name: "Test Demo" } },
    });

    // Override the addDemonstration trigger with our mock to spy on it
    const currentMock = vi.mocked(useDemonstration)();
    vi.mocked(useDemonstration).mockReturnValue({
      ...currentMock,
      addDemonstration: {
        ...currentMock.addDemonstration,
        trigger: mockTrigger,
      },
    });

    renderModal();

    // Fill out the form
    const stateSelect = screen.getByTestId("state-select");
    const titleInput = screen.getByLabelText(/Demonstration Title/i);
    const userSelect = screen.getByTestId("user-select");
    const submitButton = screen.getByText("Submit");

    fireEvent.change(stateSelect, { target: { value: "1" } });
    fireEvent.change(titleInput, { target: { value: "Test Demonstration" } });
    fireEvent.change(userSelect, { target: { value: "1" } });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockTrigger).toHaveBeenCalledWith({
        name: "Test Demonstration",
        description: "",
        evaluationPeriodStartDate: expect.any(Date),
        evaluationPeriodEndDate: expect.any(Date),
        demonstrationStatusId: "1",
        stateId: "1",
        userIds: ["1"],
      });
    });
  });

  it("submits updated data in edit mode", async () => {
    const { useDemonstration } = await import("hooks/useDemonstration");
    const mockTrigger = vi.fn().mockResolvedValue({
      data: { updateDemonstration: { id: "1", name: "Updated Demo" } },
    });

    const currentMock = vi.mocked(useDemonstration)();
    vi.mocked(useDemonstration).mockReturnValue({
      ...currentMock,
      updateDemonstration: {
        ...currentMock.updateDemonstration,
        trigger: mockTrigger,
      },
    });

    const demonstration = {
      id: "1",
      name: "Original Demo",
      state: { id: "1", stateName: "California" },
      userIds: ["1"],
      evaluationPeriodStartDate: "2024-06-20T00:00:00.000Z",
      evaluationPeriodEndDate: "2024-07-20T00:00:00.000Z",
      description: "Original description",
    };

    renderModal({ mode: "edit", demonstration });

    // Fill out the form
    const stateSelect = screen.getByTestId("state-select");
    const titleInput = screen.getByLabelText(/Demonstration Title/i);
    const userSelect = screen.getByTestId("user-select");
    const submitButton = screen.getByText("Submit");

    fireEvent.change(stateSelect, { target: { value: "1" } });
    fireEvent.change(titleInput, { target: { value: "Updated Demo" } });
    fireEvent.change(userSelect, { target: { value: "1" } });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockTrigger).toHaveBeenCalledWith("1", {
        name: "Updated Demo",
        description: "Original description",
        evaluationPeriodStartDate: new Date("2024-06-20T00:00:00.000Z"),
        evaluationPeriodEndDate: new Date("2024-07-20T00:00:00.000Z"),
        demonstrationStatusId: "1",
        stateId: "1",
        userIds: ["1"],
      });
    });
  });
});
