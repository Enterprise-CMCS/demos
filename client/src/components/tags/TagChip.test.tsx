import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TagChip } from "./TagChip";

describe("TagChip", () => {
  it("renders the tag text", () => {
    render(<TagChip tag="TestTag" onRemoveTag={() => {}} />);
    expect(screen.getByText("TestTag")).toBeInTheDocument();
  });

  it("calls onRemoveTag when remove button is clicked", () => {
    const onRemoveTag = vi.fn();
    render(<TagChip tag="TestTag" onRemoveTag={onRemoveTag} />);
    const button = screen.getByTestId("remove-TestTag-button");
    fireEvent.click(button);
    expect(onRemoveTag).toHaveBeenCalledWith("TestTag");
  });
});
