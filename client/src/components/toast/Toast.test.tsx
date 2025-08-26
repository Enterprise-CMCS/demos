import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { InfoToast } from "./InfoToast";
import { SuccessToast } from "./SuccessToast";
import { WarningToast } from "./WarningToast";
import { ErrorToast } from "./ErrorToast";

describe("Toast Components", () => {
  const defaultMessage = "Test toast message";
  const mockOnDismiss = vi.fn();

  beforeEach(() => {
    mockOnDismiss.mockClear();
  });

  describe("InfoToast", () => {
    it("renders as info type with correct styling", () => {
      render(<InfoToast message={defaultMessage} />);
      const alert = screen.getByRole("alert");
      expect(alert).toHaveClass("border-brand");
    });
  });

  describe("SuccessToast", () => {
    it("renders as success type with correct styling", () => {
      render(<SuccessToast message={defaultMessage} />);
      const alert = screen.getByRole("alert");
      expect(alert).toHaveClass("border-border-success");
    });
  });

  describe("WarningToast", () => {
    it("renders as warning type with correct styling", () => {
      render(<WarningToast message={defaultMessage} />);
      const alert = screen.getByRole("alert");
      expect(alert).toHaveClass("border-border-alert");
    });
  });

  describe("ErrorToast", () => {
    it("renders as error type with correct styling", () => {
      render(<ErrorToast message={defaultMessage} />);
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
          render(<Component message={defaultMessage} />);
          const alert = screen.getByRole("alert");
          expect(alert).toBeInTheDocument();
        });

        it("renders dismiss button with proper aria-label", () => {
          render(<Component message={defaultMessage} />);
          const dismissButton = screen.getByLabelText("Dismiss notification");
          expect(dismissButton).toBeInTheDocument();
        });
      });
    });
  });
});
