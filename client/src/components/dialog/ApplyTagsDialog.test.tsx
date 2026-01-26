import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

import { ApplyTagsDialog } from "./ApplyTagsDialog";
import { DEMONSTRATION_TYPE_TAGS } from "demos-server-constants";

describe("ApplyTagsDialog", () => {
  const setup = (selectedTags: string[] = []) => {
    const onClose = vi.fn();
    const result = render(
      <ApplyTagsDialog
        onClose={onClose}
        initiallySelectedTags={selectedTags}
        allTags={DEMONSTRATION_TYPE_TAGS}
      />
    );
    return { ...result, onClose };
  };

  it("renders with initial tags", () => {
    const tags = ["Behavioral Health", "Dental", "CHIP"];
    setup(tags);

    expect(screen.getByText("Apply Tags")).toBeInTheDocument();
    expect(screen.getByText("Selected Tag(s)")).toBeInTheDocument();
    expect(screen.getByTestId("checkbox-Behavioral Health")).toBeChecked();
    expect(screen.getByTestId("checkbox-Dental")).toBeChecked();
    expect(screen.getByRole("button", { name: "button-confirm-apply-tags" })).toBeInTheDocument();
  });

  it("renders empty state when no tags provided", () => {
    setup();

    expect(screen.getByText("Apply Tags")).toBeInTheDocument();
    expect(screen.getByText("No tags selected")).toBeInTheDocument();
  });

  it("calls onClose when apply button is clicked", async () => {
    const user = userEvent.setup();
    const selectedTags = ["Behavioral Health"];
    const { onClose } = setup(selectedTags);

    await user.click(screen.getByRole("button", { name: "button-confirm-apply-tags" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when dialog is closed via BaseDialog", async () => {
    const user = userEvent.setup();
    const { onClose } = setup(["Tag1"]);

    const closeButton = screen.getByRole("button", { name: /close/i });
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it("displays multiple tags correctly", () => {
    const selectedTags = DEMONSTRATION_TYPE_TAGS.slice(3, 6);
    setup(selectedTags);

    // Check that the selected tags are rendered as chips
    selectedTags.forEach((tag) => {
      expect(screen.getByTestId(`checkbox-${tag}`)).toBeChecked();
    });
  });

  it("filters tags based on search query", async () => {
    const user = userEvent.setup();
    setup([]);

    const searchInput = screen.getByPlaceholderText("Search");
    await user.type(searchInput, "dental");

    // Should show only tags containing "dental"
    expect(screen.getByTestId("checkbox-Dental")).toBeInTheDocument();

    // Other tags should not be visible
    expect(screen.queryByTestId("checkbox-Behavioral Health")).not.toBeInTheDocument();
  });

  it("shows 'No tags found' message when search returns no results", async () => {
    const user = userEvent.setup();
    setup([]);

    const searchInput = screen.getByPlaceholderText("Search");
    await user.type(searchInput, "nonexistenttag123");

    expect(screen.getByText("No tags found")).toBeInTheDocument();
  });
});
