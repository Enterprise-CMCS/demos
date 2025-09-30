import React from "react";

import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { Notice } from "./Notice";

describe("Notice", () => {
  it("renders the provided title and description", () => {
    render(<Notice title="Heads up" description="Details about the notice" variant="warning" />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Heads up")).toBeVisible();
    expect(screen.getByText("Details about the notice")).toBeVisible();
  });

  it("calls onDismiss when the dismiss button is clicked", () => {
    const handleDismiss = vi.fn();

    render(<Notice title="Closable notice" onDismiss={handleDismiss} />);

    fireEvent.click(screen.getByRole("button", { name: /dismiss notice/i }));

    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it("does not render a dismiss button when onDismiss is not provided", () => {
    render(<Notice title="Sticky notice" />);

    expect(screen.queryByRole("button", { name: /dismiss notice/i })).toBeNull();
  });
});
