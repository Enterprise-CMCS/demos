import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

import { ApplyTagsDialog, TEMP_ALL_TAGS } from "./ApplyTagsDialog";

describe("ApplyTagsDialog", () => {
  it("renders with initial tags", () => {
    const onClose = vi.fn();
    const tags = ["Behavioral Health", "Dental", "CHIP"];

    render(
      <ApplyTagsDialog onClose={onClose} initiallySelectedTags={tags} allTags={TEMP_ALL_TAGS} />
    );

    expect(screen.getByText("Apply Tags")).toBeInTheDocument();
    expect(screen.getByText("Selected Tag(s)")).toBeInTheDocument();
    expect(screen.getByTestId("checkbox-Behavioral Health")).toBeChecked();
    expect(screen.getByTestId("checkbox-Dental")).toBeChecked();
    expect(screen.getByRole("button", { name: "button-confirm-apply-tags" })).toBeInTheDocument();
  });

  it("renders empty state when no tags provided", () => {
    const onClose = vi.fn();

    render(
      <ApplyTagsDialog onClose={onClose} initiallySelectedTags={[]} allTags={TEMP_ALL_TAGS} />
    );

    expect(screen.getByText("Apply Tags")).toBeInTheDocument();
    expect(screen.getByText("No tags selected")).toBeInTheDocument();
  });

  it("calls onClose when apply button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const tags = ["Behavioral Health"];

    render(
      <ApplyTagsDialog onClose={onClose} initiallySelectedTags={tags} allTags={TEMP_ALL_TAGS} />
    );

    await user.click(screen.getByRole("button", { name: "button-confirm-apply-tags" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when dialog is closed via BaseDialog", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <ApplyTagsDialog onClose={onClose} initiallySelectedTags={["Tag1"]} allTags={TEMP_ALL_TAGS} />
    );

    const closeButton = screen.getByRole("button", { name: /close/i });
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it("displays multiple tags correctly", () => {
    const onClose = vi.fn();
    const tags = ["Behavioral Health", "Dental", "Health Homes"];

    render(
      <ApplyTagsDialog onClose={onClose} initiallySelectedTags={tags} allTags={TEMP_ALL_TAGS} />
    );

    // Check that the selected tags are rendered as chips
    tags.forEach((tag) => {
      expect(screen.getByTestId(`checkbox-${tag}`)).toBeChecked();
    });
  });
});
