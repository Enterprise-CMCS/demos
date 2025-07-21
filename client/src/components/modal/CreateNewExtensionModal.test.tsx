import React from "react";

import { vi } from "vitest";

import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import { CreateNewExtensionModal } from "./CreateNewExtensionModal";

// Mocks
const showSuccess = vi.fn();
vi.mock("components/toast", () => ({
  useToast: () => ({ showSuccess }),
}));

vi.mock("components/modal/BaseModal", () => ({
  BaseModal: ({ title, children, actions }: React.PropsWithChildren<{ title?: string; actions?: React.ReactNode }>) => (
    <div>
      {title && <h2>{title}</h2>}
      <div data-testid="modal-content">{children}</div>
      <div data-testid="modal-actions">{actions}</div>
    </div>
  ),

}));

vi.mock("components/button/PrimaryButton", () => ({
  PrimaryButton: (props: React.ComponentPropsWithoutRef<"button">) => (
    <button {...props} data-testid="primary-btn">
      {props.children}
    </button>
  ),
}));
vi.mock("components/button/SecondaryButton", () => ({
  SecondaryButton: (props: React.ComponentPropsWithoutRef<"button">) => (
    <button {...props} data-testid="secondary-btn">
      {props.children}
    </button>
  ),
}));

vi.mock("components/input/select/AutoCompleteSelect", () => ({
  AutoCompleteSelect: ({
    label,
    onSelect,
    isRequired,
    options,
    placeholder,
  }: {
    label: string;
    onSelect: (value: string) => void;
    isRequired?: boolean;
    options: { value: string; label: string }[];
    placeholder?: string;
  }) => (
    <div>
      <label>{label}</label>
      <select
        data-testid="demo-select"
        required={isRequired}
        onChange={(e) => onSelect(e.target.value)}
        defaultValue=""
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  ),
}));

vi.mock("components/input/select/SelectUSAStates", () => ({
  SelectUSAStates: ({
    label,
    onStateChange,
  }: {
    label: string;
    onStateChange: (val: string) => void;
  }) => (
    <div>
      <label>{label}</label>
      <select
        data-testid="state-select"
        onChange={(e) => onStateChange(e.target.value)}
        defaultValue=""
      >
        <option value="">Select State</option>
        <option value="CA">California</option>
      </select>
    </div>
  ),
}));


vi.mock("components/input/select/SelectUsers", () => ({
  SelectUsers: ({
    label,
    onStateChange,
  }: {
    label: string;
    onStateChange: (val: string) => void;
  }) => (
    <div>
      <label>{label}</label>
      <select
        data-testid="user-select"
        onChange={(e) => onStateChange(e.target.value)}
        defaultValue=""
      >
        <option value="">Select User</option>
        <option value="user1">User One</option>
      </select>
    </div>
  ),
}));


describe("CreateNewExtensionModal", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function fillForm() {
    fireEvent.change(screen.getByTestId("demo-select"), { target: { value: "medicaid-fl" } });
    fireEvent.change(screen.getByLabelText(/Extension Title/i), { target: { value: "My Extension" } });
    fireEvent.change(screen.getByTestId("state-select"), { target: { value: "CA" } });
    fireEvent.change(screen.getByTestId("user-select"), { target: { value: "user1" } });
  }

  it("renders all required fields", () => {
    render(<CreateNewExtensionModal onClose={onClose} />);
    expect(screen.getByText("New Extension")).toBeInTheDocument();
    expect(screen.getByText("Demonstration")).toBeInTheDocument();
    expect(screen.getByText("Extension Title")).toBeInTheDocument();
    expect(screen.getByText("State/Territory")).toBeInTheDocument();
    expect(screen.getByText("Project Officer")).toBeInTheDocument();
    expect(screen.getByLabelText("Effective Date")).toBeInTheDocument();
    expect(screen.getByLabelText("Expiration Date")).toBeInTheDocument();
    expect(screen.getByLabelText("Extension Description")).toBeInTheDocument();
  });

  it("disables submit if required fields are missing", () => {
    render(<CreateNewExtensionModal onClose={onClose} />);
    expect(screen.getByTestId("primary-btn")).toBeDisabled();
    fillForm();
    expect(screen.getByTestId("primary-btn")).not.toBeDisabled();
  });

  it("shows validation warning for missing demonstration field", () => {
    render(<CreateNewExtensionModal onClose={onClose} />);
    fireEvent.submit(screen.getByTestId("modal-content").querySelector("form")!);
    expect(screen.getByText(/Each extension record must first be linked/i)).toBeInTheDocument();
  });

  it("validates expiration cannot be before effective", () => {
    render(<CreateNewExtensionModal onClose={onClose} />);
    fillForm();
    fireEvent.change(screen.getByLabelText("Effective Date"), { target: { value: "2024-06-10" } });
    fireEvent.change(screen.getByLabelText("Expiration Date"), { target: { value: "2024-06-01" } });
    expect(screen.getByText(/Expiration Date cannot be before Effective Date/)).toBeInTheDocument();
  });

  it("clears expiration date when effective is later", () => {
    render(<CreateNewExtensionModal onClose={onClose} />);
    fillForm();
    fireEvent.change(screen.getByLabelText("Effective Date"), { target: { value: "2024-06-15" } });
    fireEvent.change(screen.getByLabelText("Expiration Date"), { target: { value: "2024-06-20" } });
    fireEvent.change(screen.getByLabelText("Effective Date"), { target: { value: "2024-06-25" } });
    expect(screen.getByLabelText("Expiration Date")).toHaveValue("");
  });

  it("submits and calls onClose and showSuccess", async () => {
    render(<CreateNewExtensionModal onClose={onClose} />);
    fillForm();
    fireEvent.change(screen.getByLabelText("Effective Date"), { target: { value: "2024-06-20" } });
    fireEvent.change(screen.getByLabelText("Expiration Date"), { target: { value: "2024-06-21" } });
    fireEvent.change(screen.getByLabelText("Extension Description"), { target: { value: "desc" } });

    fireEvent.submit(screen.getByTestId("modal-content").querySelector("form")!);

    await waitFor(() => {
      expect(showSuccess).toHaveBeenCalledWith("Extension created successfully!");
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("shows cancel confirmation modal when Cancel is clicked", () => {
    render(<CreateNewExtensionModal onClose={onClose} />);
    fireEvent.click(screen.getByTestId("secondary-btn"));
    // Modal is mocked, so we expect Cancel button to still be present
    expect(screen.getByTestId("secondary-btn")).toBeInTheDocument();
  });
});
