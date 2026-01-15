import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

import { DemonstrationHealthTypeTags } from "./DemonstrationHealthTypeTags";

describe("DemonstrationHealthTypeTags", () => {
  it("renders tags and apply button", () => {
    render(
      <DemonstrationHealthTypeTags
        title="STEP 3 - APPLY TAGS"
        description="You must tag this application with one or more demonstration types involved."
        tags={["Behavioral Health", "Dental"]}
        onRemoveTag={() => {}}
      />
    );

    expect(screen.getByText("STEP 3 - APPLY TAGS")).toBeInTheDocument();
    expect(
      screen.getByText(
        "You must tag this application with one or more demonstration types involved."
      )
    ).toBeInTheDocument();
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
        title="STEP 3 - APPLY TAGS"
        description="You must tag this application with one or more demonstration types involved."
        tags={["Behavioral Health", "Dental"]}
        onRemoveTag={onRemoveTag}
      />
    );

    await user.click(screen.getByLabelText("Remove Dental"));
    expect(onRemoveTag).toHaveBeenCalledWith("Dental");
  });
});
