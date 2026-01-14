import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

import { DemonstrationHealthTypeTags } from "./DemonstrationHealthTypeTags";

describe("DemonstrationHealthTypeTags", () => {
  it("renders tags and apply button", () => {
    render(
      <DemonstrationHealthTypeTags
        tags={["Behavioral Health", "Dental"]}
        onRemoveTag={() => {}}
        onApply={() => {}}
      />
    );

    expect(screen.getByText("Behavioral Health")).toBeInTheDocument();
    expect(screen.getByText("Dental")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "button-apply-application-tags" })
    ).toBeInTheDocument();
  });

  it("calls onRemoveTag when a tag remove button is clicked", async () => {
    const user = userEvent.setup();
    const onRemoveTag = vi.fn();

    render(
      <DemonstrationHealthTypeTags
        tags={["Behavioral Health", "Dental"]}
        onRemoveTag={onRemoveTag}
        onApply={() => {}}
      />
    );

    await user.click(screen.getByLabelText("Remove Dental"));
    expect(onRemoveTag).toHaveBeenCalledWith("Dental");
  });

  it("calls onApply when apply button is clicked", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();

    render(
      <DemonstrationHealthTypeTags
        tags={["Behavioral Health"]}
        onRemoveTag={() => {}}
        onApply={onApply}
      />
    );

    await user.click(screen.getByRole("button", { name: "button-apply-application-tags" }));
    expect(onApply).toHaveBeenCalledTimes(1);
  });

  it("disables apply button when there are no tags", () => {
    render(
      <DemonstrationHealthTypeTags tags={[]} onRemoveTag={() => {}} onApply={() => {}} />
    );

    expect(
      screen.getByRole("button", { name: "button-apply-application-tags" })
    ).toBeDisabled();
  });
});
