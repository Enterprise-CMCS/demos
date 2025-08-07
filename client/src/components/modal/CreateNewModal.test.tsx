import React, { ReactNode } from "react";

import { vi } from "vitest";

import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import { CreateNewModal } from "./CreateNewModal";

// Mocks
const showSuccess = vi.fn();
const showError = vi.fn();
vi.mock("components/toast", () => ({
  useToast: () => ({ showSuccess, showError }),
}));

// Mock useDemonstration hook
vi.mock("hooks/useDemonstration", () => ({
  useDemonstration: () => ({
    getAllDemonstrations: {
      trigger: vi.fn(),
      data: [
        { id: "demo-1", name: "Test Demo 1" },
        { id: "demo-2", name: "Test Demo 2" },
      ],
      loading: false,
      error: null,
    },
  }),
}));

// Mock useExtension hook
vi.mock("hooks/useExtension", () => ({
  useExtension: () => ({
    addExtension: {
      trigger: vi.fn().mockResolvedValue({
        data: { addExtension: { id: "ext-1", name: "Test Extension" } },
      }),
      data: undefined,
      loading: false,
      error: undefined,
    },
  }),
}));

vi.mock("components/modal/BaseModal", () => ({
  BaseModal: ({ title, children, actions }: { title?: string; children: ReactNode; actions?: ReactNode }) => (
    <div>
      {title && <h2>{title}</h2>}
      <div data-testid="modal-content">{children}</div>
      <div data-testid="modal-actions">{actions}</div>
    </div>
  ),
}));

vi.mock("components/button/PrimaryButton", () => ({
  PrimaryButton: (props: React.ComponentPropsWithoutRef<"button">) => (
    <button {...props} data-testid="primary-btn">{props.children}</button>
  ),
}));
vi.mock("components/button/SecondaryButton", () => ({
  SecondaryButton: (props: React.ComponentPropsWithoutRef<"button">) => (
    <button {...props} data-testid="secondary-btn">{props.children}</button>
  ),
}));

vi.mock("components/input/select/AutoCompleteSelect", () => ({
  AutoCompleteSelect: ({ label, onSelect }: { label: string; onSelect: (val: string) => void }) => (
    <div>
      <label>{label}</label>
      <select data-testid="demo-select" onChange={(e) => onSelect(e.target.value)}>
        <option value="">Select</option>
        <option value="demo">Demo</option>
      </select>
    </div>
  ),
}));

vi.mock("components/input/select/SelectUSAStates", () => ({
  SelectUSAStates: ({ label, onStateChange }: { label: string; onStateChange: (val: string) => void }) => (
    <div>
      <label>{label}</label>
      <select data-testid="state-select" onChange={(e) => onStateChange(e.target.value)}>
        <option value="">Select</option>
        <option value="CA">California</option>
      </select>
    </div>
  ),
}));

vi.mock("components/input/select/SelectUsers", () => ({
  SelectUsers: ({ label, onStateChange }: { label: string; onStateChange: (val: string) => void }) => (
    <div>
      <label>{label}</label>
      <select data-testid="user-select" onChange={(e) => onStateChange(e.target.value)}>
        <option value="">Select</option>
        <option value="user1">User 1</option>
      </select>
    </div>
  ),
}));

vi.mock("components/input/TextInput", () => ({
  TextInput: ({ label, onChange, value }: { label: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; value: string }) => (
    <div>
      <label>{label}</label>
      <input data-testid="title-input" value={value} onChange={onChange} />
    </div>
  ),
}));

describe.each(["amendment", "extension", "demonstration"] as const)("CreateNewModal (%s)", (mode) => {
  const onClose = vi.fn();

  const fillForm = (mode: string) => {
    if (mode !== "demonstration") {
      fireEvent.change(screen.getByTestId("demo-select"), { target: { value: "demo" } });
    }
    fireEvent.change(screen.getByTestId("title-input"), { target: { value: "Test Title" } });
    fireEvent.change(screen.getByTestId("state-select"), { target: { value: "CA" } });
    fireEvent.change(screen.getByTestId("user-select"), { target: { value: "user1" } });
  };

  it("renders and submits successfully", async () => {
    render(<CreateNewModal mode={mode} onClose={onClose} />);

    expect(screen.getByText(`New ${mode.charAt(0).toUpperCase() + mode.slice(1)}`)).toBeInTheDocument();

    fillForm(mode);

    fireEvent.submit(screen.getByTestId("modal-content").querySelector("form")!);

    await waitFor(() => {
      expect(showSuccess).toHaveBeenCalledWith(`${mode.charAt(0).toUpperCase() + mode.slice(1)} created successfully!`);
      expect(onClose).toHaveBeenCalled();
    });
  });

  if (mode !== "demonstration") {
    it("shows validation warning if demonstration is empty", () => {
      render(<CreateNewModal mode={mode} onClose={onClose} />);
      fireEvent.submit(screen.getByTestId("modal-content").querySelector("form")!);
      expect(screen.getByText(/must be linked to an existing demonstration/)).toBeInTheDocument();
    });
  }

  it("disables submit button if required fields are missing", () => {
    render(<CreateNewModal mode={mode} onClose={onClose} />);
    expect(screen.getByTestId("primary-btn")).toBeDisabled();
    fillForm(mode);
    expect(screen.getByTestId("primary-btn")).not.toBeDisabled();
  });

  it("renders correct dynamic labels", () => {
    render(<CreateNewModal mode={mode} onClose={onClose} />);
    expect(screen.getByText(`${mode.charAt(0).toUpperCase() + mode.slice(1)} Title`)).toBeInTheDocument();
    expect(screen.getByText(`${mode.charAt(0).toUpperCase() + mode.slice(1)} Description`)).toBeInTheDocument();
  });
});
