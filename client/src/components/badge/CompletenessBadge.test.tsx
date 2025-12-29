import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CompletenessBadge } from "./CompletenessBadge";

describe("CompletenessBadge", () => {
  it("renders 'Complete' with green background when isComplete is true", () => {
    const { container } = render(<CompletenessBadge isComplete={true} />);

    expect(screen.getByText("Complete")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("bg-success", "text-white");
  });

  it("renders 'Incomplete' with yellow background when isComplete is false", () => {
    const { container } = render(<CompletenessBadge isComplete={false} />);

    expect(screen.getByText("Incomplete")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("bg-warn-light", "text-black");
  });
});
