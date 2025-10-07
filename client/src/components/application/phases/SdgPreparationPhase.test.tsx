import "@testing-library/jest-dom";
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TestProvider } from "test-utils/TestProvider";

import { SdgPreparationPhase } from "./SdgPreparationPhase";

// Define minimal prop interfaces for mocked components
interface DatePickerProps {
  className?: string;
  name: string;
  required?: boolean;
  slotProps?: {
    textField?: {
      placeholder?: string;
      name?: string;
    };
  };
  children?: React.ReactNode;
}

interface ButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  size?: string;
  name: string;
}

// --- Mocks ---

vi.mock("components/input/DatePicker/DatePicker", () => ({
  DatePicker: (props: DatePickerProps) => {
    const { children, slotProps, name } = props;
    return (
      <div data-testid={`datepicker-${name}`}>
        <label>{children}</label>
        <input
          placeholder={slotProps?.textField?.placeholder}
          name={name}
          aria-label={children ? String(children) : name}
        />
      </div>
    );
  },
}));

vi.mock("components/button", () => ({
  Button: (props: ButtonProps) => {
    const { children, onClick, disabled, name } = props;
    return (
      <button
        name={name}
        onClick={onClick}
        disabled={disabled}
        data-testid={name}
      >
        {children}
      </button>
    );
  },
  SecondaryButton: (props: ButtonProps) => {
    const { children, onClick, name } = props;
    return (
      <button name={name} onClick={onClick} data-testid={name}>
        {children}
      </button>
    );
  },
}));

// --- Tests ---

describe("SdgPreparationPhase", () => {
  const setup = (): void => {
    render(
      <TestProvider>
        <SdgPreparationPhase />
      </TestProvider>
    );
  };

  describe("Header and Description", () => {
    it("renders the main section header and description", () => {
      setup();

      expect(screen.getByText("SDG PREPARATION")).toBeInTheDocument();
      expect(
        screen.getByText("Plan and conduct internal and preparation tasks")
      ).toBeInTheDocument();
    });
  });

  describe("SDG Workplan Section", () => {
    it("renders title and helper text", () => {
      setup();

      expect(screen.getByText("SDG WORKPLAN")).toBeInTheDocument();
      expect(
        screen.getByText(
          /Ensure the expected approval date is reasonable based on required reviews/i
        )
      ).toBeInTheDocument();
    });

    it("renders Expected Approval Date DatePicker", () => {
      setup();

      const datePicker = screen.getByTestId("datepicker-expected-approval-date");
      expect(datePicker).toBeInTheDocument();

      expect(screen.getByText("Expected Approval Date")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Expected Approval Date")
      ).toBeInTheDocument();
    });
  });

  describe("Internal Reviews Section", () => {
    it("renders title and helper text", () => {
      setup();

      expect(screen.getByText("INTERNAL REVIEWS")).toBeInTheDocument();
      expect(
        screen.getByText("Record the occurrence of the key review meetings")
      ).toBeInTheDocument();
    });

    it("renders all three DatePickers", () => {
      setup();

      expect(
        screen.getByTestId("datepicker-sme-initial-review-date")
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("datepicker-frt-intial-meeting-date")
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("datepicker-bnpmt-intial-meeting-date")
      ).toBeInTheDocument();
    });

    it("renders Save For Later and Finish buttons", () => {
      setup();

      const saveButton = screen.getByTestId("sdg-save-for-later");
      const finishButton = screen.getByTestId("sdg-finish");

      expect(saveButton).toBeInTheDocument();
      expect(finishButton).toBeInTheDocument();
      expect(finishButton).toBeDisabled();
    });

    it("calls correct handlers when buttons clicked", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      setup();

      const saveButton = screen.getByTestId("sdg-save-for-later");

      await userEvent.click(saveButton);
      expect(consoleSpy).toHaveBeenCalledWith("Save For Later Clicked");

      consoleSpy.mockRestore();
    });
  });
});
