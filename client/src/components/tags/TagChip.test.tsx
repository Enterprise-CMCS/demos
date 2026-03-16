import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TagChip } from "./TagChip";
import { Tag } from "demos-server";

describe("TagChip", () => {
  const testTag: Tag = {
    tagName: "TestTag",
    approvalStatus: "Approved",
  };
  it("renders the tag text", () => {
    render(<TagChip tag={testTag} onRemoveTag={() => {}} />);
    expect(screen.getByText("TestTag")).toBeInTheDocument();
  });

  it("calls onRemoveTag when remove button is clicked", () => {
    const onRemoveTag = vi.fn();
    render(<TagChip tag={testTag} onRemoveTag={onRemoveTag} />);
    const button = screen.getByTestId("remove-TestTag-button");
    fireEvent.click(button);
    expect(onRemoveTag).toHaveBeenCalledWith("TestTag");
  });
});

describe("Approval status", () => {
  it("renders approved status", () => {
    render(
      <TagChip
        tag={{ tagName: "ApprovedTag", approvalStatus: "Approved" }}
        onRemoveTag={() => {}}
      />
    );
    const tagElement = screen.getByText("ApprovedTag");
    expect(tagElement).toBeInTheDocument();
    expect(tagElement).toHaveClass("bg-surface-white");
  });

  it("renders unapproved status", () => {
    render(
      <TagChip
        tag={{ tagName: "UnapprovedTag", approvalStatus: "Unapproved" }}
        onRemoveTag={() => {}}
      />
    );
    const tagElement = screen.getByText("UnapprovedTag (Unapproved)");
    expect(tagElement).toBeInTheDocument();
    expect(tagElement).toHaveClass("bg-border-alert");
  });
});
