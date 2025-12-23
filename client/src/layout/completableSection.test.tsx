import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CompletableSection } from "./completableSection";
import userEvent from "@testing-library/user-event";

describe("CompletableSection", () => {
  const defaultProps = {
    title: "Test Section",
    isComplete: false,
    children: <div>Test content</div>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders the section title", () => {
      render(<CompletableSection {...defaultProps} />);
      expect(screen.getByText("Test Section")).toBeInTheDocument();
    });

    it("renders children by default", () => {
      render(<CompletableSection {...defaultProps} />);
      expect(screen.getByText("Test content")).toBeInTheDocument();
    });

    it("displays Complete badge when isComplete is true", () => {
      render(<CompletableSection {...defaultProps} isComplete={true} />);
      expect(screen.getByText("Complete")).toBeInTheDocument();
    });

    it("displays Incomplete badge when isComplete is false", () => {
      render(<CompletableSection {...defaultProps} isComplete={false} />);
      expect(screen.getByText("Incomplete")).toBeInTheDocument();
    });
  });

  describe("Interaction", () => {
    it("toggles expansion when button is clicked", () => {
      render(<CompletableSection {...defaultProps} />);
      const button = screen.getByRole("button");
      expect(screen.getByText("Test content")).toBeInTheDocument();

      fireEvent.click(button);
      expect(screen.queryByText("Test content")).not.toBeInTheDocument();

      fireEvent.click(button);
      expect(screen.getByText("Test content")).toBeInTheDocument();
    });

    it("toggles on Enter key press", async () => {
      const user = userEvent.setup();
      render(<CompletableSection {...defaultProps} />);
      expect(screen.getByText("Test content")).toBeInTheDocument();

      const button = screen.getByRole("button");
      button.focus();

      await user.keyboard("{Enter}");
      expect(screen.queryByText("Test content")).not.toBeInTheDocument();

      await user.keyboard("{Enter}");
      expect(screen.getByText("Test content")).toBeInTheDocument();
    });

    it("toggles on Space key press", async () => {
      const user = userEvent.setup();
      render(<CompletableSection {...defaultProps} />);
      expect(screen.getByText("Test content")).toBeInTheDocument();

      const button = screen.getByRole("button");
      button.focus();

      await user.keyboard("{ }");
      expect(screen.queryByText("Test content")).not.toBeInTheDocument();

      await user.keyboard("{ }");
      expect(screen.getByText("Test content")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("renders as a section element", () => {
      const { container } = render(<CompletableSection {...defaultProps} />);
      const section = container.querySelector("section");
      expect(section).toBeInTheDocument();
    });

    it("button has correct aria-expanded when expanded", () => {
      render(<CompletableSection {...defaultProps} />);
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-expanded", "true");
    });

    it("button has correct aria-expanded when collapsed", () => {
      render(<CompletableSection {...defaultProps} />);
      const button = screen.getByRole("button");
      fireEvent.click(button);
      expect(button).toHaveAttribute("aria-expanded", "false");
    });

    it("button has aria-controls pointing to content region", () => {
      render(<CompletableSection {...defaultProps} />);
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-controls", "section-test-section");
    });

    it("content region has matching id for aria-controls", () => {
      render(<CompletableSection {...defaultProps} />);
      const region = screen.getByRole("region");
      expect(region).toHaveAttribute("id", "section-test-section");
    });

    it("content region has role=region when expanded", () => {
      render(<CompletableSection {...defaultProps} />);
      const region = screen.getByRole("region");
      expect(region).toBeInTheDocument();
    });

    it("heading has correct id for aria-labelledby", () => {
      render(<CompletableSection {...defaultProps} />);
      const heading = screen.getByText("Test Section");
      expect(heading).toHaveAttribute("id", "heading-test-section");
    });

    it("content region has aria-labelledby pointing to heading", () => {
      render(<CompletableSection {...defaultProps} />);
      const region = screen.getByRole("region");
      expect(region).toHaveAttribute("aria-labelledby", "heading-test-section");
    });

    it("button has descriptive aria-label when complete and collapsed", () => {
      render(<CompletableSection {...defaultProps} isComplete={true} />);
      const button = screen.getByRole("button");
      fireEvent.click(button);
      expect(button).toHaveAttribute("aria-label", "Test Section, complete, expand section");
    });

    it("sanitizes title with spaces for IDs", () => {
      render(<CompletableSection {...defaultProps} title="PO & OGD" />);
      const button = screen.getByRole("button");
      const region = screen.getByRole("region");

      expect(button).toHaveAttribute("aria-controls", "section-po-&-ogd");
      expect(region).toHaveAttribute("id", "section-po-&-ogd");
    });

    it("button is keyboard accessible", () => {
      render(<CompletableSection {...defaultProps} />);
      const button = screen.getByRole("button");
      expect(button).not.toHaveAttribute("tabindex", "-1");
    });
  });
});
