import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CompletableSection } from "./completableSection";

describe("CompletableSection", () => {
  const mockSetIsExpanded = vi.fn();

  const defaultProps = {
    title: "Test Section",
    isComplete: false,
    isExpanded: true,
    setIsExpanded: mockSetIsExpanded,
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

    it("renders children when expanded", () => {
      render(<CompletableSection {...defaultProps} isExpanded={true} />);
      expect(screen.getByText("Test content")).toBeInTheDocument();
    });

    it("does not render children when collapsed", () => {
      render(<CompletableSection {...defaultProps} isExpanded={false} />);
      expect(screen.queryByText("Test content")).not.toBeInTheDocument();
    });

    it("displays Complete badge when isComplete is true", () => {
      render(<CompletableSection {...defaultProps} isComplete={true} />);
      expect(screen.getByText("Complete")).toBeInTheDocument();
    });

    it("displays Incomplete badge when isComplete is false", () => {
      render(<CompletableSection {...defaultProps} isComplete={false} />);
      expect(screen.getByText("Incomplete")).toBeInTheDocument();
    });

    it("shows ChevronDownIcon when expanded", () => {
      render(<CompletableSection {...defaultProps} isExpanded={true} />);
      const button = screen.getByRole("button");
      const icon = button.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("shows ChevronRightIcon when collapsed", () => {
      render(<CompletableSection {...defaultProps} isExpanded={false} />);
      const button = screen.getByRole("button");
      const icon = button.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });
  });

  describe("Interaction", () => {
    it("calls setIsExpanded with opposite value when button is clicked", () => {
      render(<CompletableSection {...defaultProps} isExpanded={true} />);
      const button = screen.getByRole("button");

      fireEvent.click(button);
      expect(mockSetIsExpanded).toHaveBeenCalledWith(false);
    });

    it("calls setIsExpanded with true when collapsed section is clicked", () => {
      render(<CompletableSection {...defaultProps} isExpanded={false} />);
      const button = screen.getByRole("button");

      fireEvent.click(button);
      expect(mockSetIsExpanded).toHaveBeenCalledWith(true);
    });

    it("toggles on Enter key press", () => {
      render(<CompletableSection {...defaultProps} isExpanded={true} />);
      const button = screen.getByRole("button");

      fireEvent.keyDown(button, { key: "Enter", code: "Enter" });
      fireEvent.click(button);
      expect(mockSetIsExpanded).toHaveBeenCalled();
    });

    it("toggles on Space key press", () => {
      render(<CompletableSection {...defaultProps} isExpanded={true} />);
      const button = screen.getByRole("button");

      fireEvent.keyDown(button, { key: " ", code: "Space" });
      fireEvent.click(button);
      expect(mockSetIsExpanded).toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("renders as a section element", () => {
      const { container } = render(<CompletableSection {...defaultProps} />);
      const section = container.querySelector("section");
      expect(section).toBeInTheDocument();
    });

    it("button has correct aria-expanded when expanded", () => {
      render(<CompletableSection {...defaultProps} isExpanded={true} />);
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-expanded", "true");
    });

    it("button has correct aria-expanded when collapsed", () => {
      render(<CompletableSection {...defaultProps} isExpanded={false} />);
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-expanded", "false");
    });

    it("button has aria-controls pointing to content region", () => {
      render(<CompletableSection {...defaultProps} isExpanded={true} />);
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-controls", "section-test-section");
    });

    it("content region has matching id for aria-controls", () => {
      render(<CompletableSection {...defaultProps} isExpanded={true} />);
      const region = screen.getByRole("region");
      expect(region).toHaveAttribute("id", "section-test-section");
    });

    it("content region has role=region when expanded", () => {
      render(<CompletableSection {...defaultProps} isExpanded={true} />);
      const region = screen.getByRole("region");
      expect(region).toBeInTheDocument();
    });

    it("heading has correct id for aria-labelledby", () => {
      render(<CompletableSection {...defaultProps} />);
      const heading = screen.getByText("Test Section");
      expect(heading).toHaveAttribute("id", "heading-test-section");
    });

    it("content region has aria-labelledby pointing to heading", () => {
      render(<CompletableSection {...defaultProps} isExpanded={true} />);
      const region = screen.getByRole("region");
      expect(region).toHaveAttribute("aria-labelledby", "heading-test-section");
    });

    it("button has descriptive aria-label when complete and collapsed", () => {
      render(<CompletableSection {...defaultProps} isComplete={true} isExpanded={false} />);
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label", "Test Section, complete, expand section");
    });

    it("sanitizes title with spaces for IDs", () => {
      render(<CompletableSection {...defaultProps} title="PO & OGD" isExpanded={true} />);
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
