import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BaseToast, ToastType } from "./BaseToast";

describe("BaseToast", () => {
  const defaultProps = {
    message: "Test toast message",
    toastType: "info" as ToastType,
    onDismiss: vi.fn(),
  };

  it("renders with message", () => {
    render(<BaseToast {...defaultProps} />);
    expect(screen.getByText("Test toast message")).toBeInTheDocument();
  });

  it("has proper accessibility attributes", () => {
    render(<BaseToast {...defaultProps} />);
    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
  });

  it("renders dismiss button with proper aria-label", () => {
    render(<BaseToast {...defaultProps} />);
    const dismissButton = screen.getByLabelText("Dismiss notification");
    expect(dismissButton).toBeInTheDocument();
  });

  it("calls onDismiss when dismiss button is clicked", () => {
    const mockOnDismiss = vi.fn();
    render(<BaseToast {...defaultProps} onDismiss={mockOnDismiss} />);

    const dismissButton = screen.getByLabelText("Dismiss notification");
    fireEvent.click(dismissButton);

    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  describe("Toast Types", () => {
    it("renders info toast with correct icon", () => {
      render(<BaseToast {...defaultProps} toastType="info" />);
      const alert = screen.getByRole("alert");
      expect(alert).toHaveClass("border-brand");
    });

    it("renders success toast with correct styling", () => {
      render(<BaseToast {...defaultProps} toastType="success" />);
      const alert = screen.getByRole("alert");
      expect(alert).toHaveClass("border-border-success");
    });

    it("renders warning toast with correct styling", () => {
      render(<BaseToast {...defaultProps} toastType="warning" />);
      const alert = screen.getByRole("alert");
      expect(alert).toHaveClass("border-border-alert");
    });

    it("renders error toast with correct styling", () => {
      render(<BaseToast {...defaultProps} toastType="error" />);
      const alert = screen.getByRole("alert");
      expect(alert).toHaveClass("border-border-warn");
    });
  });

  describe("Content Layout", () => {
    it("renders icon, message, and dismiss button in correct order", () => {
      render(<BaseToast {...defaultProps} message="Test message" />);

      const alert = screen.getByRole("alert");
      const children = Array.from(alert.children);

      // Should have 3 children: icon container, message span, dismiss button
      expect(children).toHaveLength(3);

      // Message should be in the middle
      expect(children[1]).toHaveTextContent("Test message");

      // Dismiss button should be last
      expect(children[2]).toHaveAttribute("aria-label", "Dismiss notification");
    });
  });

  describe("Error Handling", () => {
    it("throws error for unknown toast type", () => {
      // We need to suppress console.error for this test
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        render(<BaseToast {...defaultProps} toastType={"unknown" as ToastType} />);
      }).toThrow("Unknown toast type: unknown");

      consoleSpy.mockRestore();
    });
  });

  describe("Message Content", () => {
    it("renders long messages properly", () => {
      const longMessage = "This is a very long toast message that should still be displayed properly without breaking the layout or causing any visual issues.";
      render(<BaseToast {...defaultProps} message={longMessage} />);
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it("renders empty message", () => {
      render(<BaseToast {...defaultProps} message="" />);
      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
    });

    it("handles special characters in message", () => {
      const specialMessage = "Alert! <script>alert('xss')</script> & 100% success!";
      render(<BaseToast {...defaultProps} message={specialMessage} />);
      expect(screen.getByText(specialMessage)).toBeInTheDocument();
    });
  });
});
