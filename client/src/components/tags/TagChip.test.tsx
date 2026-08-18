import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TagChip } from "./TagChip";
import { Tag } from "demos-server";
import { TestProvider } from "test-utils/TestProvider";
import { readonlyMockUser } from "mock-data/userMocks";

const renderTagChip = (
  element: React.ReactElement,
  currentUser = { person: { personType: "demos-admin" } }
) =>
  render(
    <TestProvider
      currentUser={currentUser as React.ComponentProps<typeof TestProvider>["currentUser"]}
    >
      {element}
    </TestProvider>
  );

describe("TagChip", () => {
  const testTag: Tag = {
    tagName: "TestTag",
    approvalStatus: "Approved",
  };
  it("renders the tag text", () => {
    renderTagChip(<TagChip tag={testTag} onRemoveTag={() => {}} />);
    expect(screen.getByText("TestTag")).toBeInTheDocument();
  });

  it("calls onRemoveTag when remove button is clicked", () => {
    const onRemoveTag = vi.fn();
    renderTagChip(<TagChip tag={testTag} onRemoveTag={onRemoveTag} />);
    const button = screen.getByTestId("remove-TestTag-button");
    fireEvent.click(button);
    expect(onRemoveTag).toHaveBeenCalledWith("TestTag");
  });

  it("hides the remove button for readonly users", () => {
    renderTagChip(<TagChip tag={testTag} onRemoveTag={() => {}} />, readonlyMockUser);

    expect(screen.queryByTestId("remove-TestTag-button")).not.toBeInTheDocument();
  });
});

describe("Approval status", () => {
  it("renders approved status with white background", () => {
    renderTagChip(
      <TagChip
        tag={{ tagName: "ApprovedTag", approvalStatus: "Approved" }}
        onRemoveTag={() => {}}
      />
    );
    const tagElement = screen.getByText("ApprovedTag");
    expect(tagElement).toBeInTheDocument();
    expect(tagElement).toHaveClass("bg-surface-white");
  });

  it("renders unapproved status with yellow background", () => {
    renderTagChip(
      <TagChip
        tag={{ tagName: "UnapprovedTag", approvalStatus: "Unapproved" }}
        onRemoveTag={() => {}}
      />
    );
    const tagElement = screen.getByText("UnapprovedTag (Unapproved)");
    expect(tagElement).toBeInTheDocument();
    expect(tagElement).toHaveClass("bg-yellow-100");
    expect(tagElement).toHaveClass("border-yellow-400");
  });

  it("renders suggestion variant with purple styling", () => {
    renderTagChip(
      <TagChip
        tag={{ tagName: "Health Equity", approvalStatus: "Approved" }}
        variant="suggestion"
        onClick={() => {}}
        aria-label="Apply suggested tag Health Equity"
      />
    );

    const tagElement = screen.getByRole("button", {
      name: "Apply suggested tag Health Equity",
    });
    expect(tagElement).toHaveClass("bg-purple-50");
    expect(tagElement).toHaveClass("border-purple-200");
    expect(tagElement).toHaveClass("text-purple-700");
  });
});
