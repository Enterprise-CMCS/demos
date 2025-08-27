import React from "react";

import { describe, expect, it, vi } from "vitest";

import { render, screen } from "@testing-library/react";

import { ErrorToast } from "./ErrorToast";
import { InfoToast } from "./InfoToast";
import { SuccessToast } from "./SuccessToast";
import { WarningToast } from "./WarningToast";

describe("Toast Components", () => {
  const defaultMessage = "Test toast message";
  const mockOnDismiss = vi.fn();

  beforeEach(() => {
    mockOnDismiss.mockClear();
  });

  describe("InfoToast", () => {
    it("renders as info type with correct styling", () => {
      render(<InfoToast message={defaultMessage} onDismiss={() => {}} />);
      const alert = screen.getByRole("alert");
      expect(alert).toHaveClass("border-brand");
    });
  });

  describe("SuccessToast", () => {
    it("renders as success type with correct styling", () => {
      render(<SuccessToast message={defaultMessage} onDismiss={() => {}} />);
      const alert = screen.getByRole("alert");
      expect(alert).toHaveClass("border-border-success");
    });
  });

  describe("WarningToast", () => {
    it("renders as warning type with correct styling", () => {
      render(<WarningToast message={defaultMessage} onDismiss={() => {}} />);
      const alert = screen.getByRole("alert");
      expect(alert).toHaveClass("border-border-alert");
    });
  });

  describe("ErrorToast", () => {
    it("renders as error type with correct styling", () => {
      render(<ErrorToast message={defaultMessage} onDismiss={() => {}} />);
      const alert = screen.getByRole("alert");
      expect(alert).toHaveClass("border-border-warn");
    });
  });

  describe("All Toast Types", () => {
    const toastComponents = [
      { Component: InfoToast, name: "InfoToast" },
      { Component: SuccessToast, name: "SuccessToast" },
      { Component: WarningToast, name: "WarningToast" },
      { Component: ErrorToast, name: "ErrorToast" },
    ];

    toastComponents.forEach(({ Component, name }) => {
      describe(name, () => {
        it("has proper accessibility attributes", () => {
          render(<Component message={defaultMessage} onDismiss={() => {}} />);
          const alert = screen.getByRole("alert");
          expect(alert).toBeInTheDocument();
        });

        it("renders dismiss button with proper aria-label", () => {
          render(<Component message={defaultMessage} onDismiss={() => {}} />);
          const dismissButton = screen.getByLabelText("Dismiss notification");
          expect(dismissButton).toBeInTheDocument();
        });
      });
    });
  });
});
