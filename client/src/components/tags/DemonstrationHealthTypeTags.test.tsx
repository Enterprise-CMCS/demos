import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

import {
  DemonstrationHealthTypeTags,
  GET_APPLICATION_TAG_OPTIONS,
} from "./DemonstrationHealthTypeTags";
import { DialogProvider } from "components/dialog/DialogContext";
import { MockedResponse } from "@apollo/client/testing";
import { TestProvider } from "test-utils/TestProvider";

const applicationTagOptionsMock: MockedResponse = {
  request: {
    query: GET_APPLICATION_TAG_OPTIONS,
  },
  result: {
    data: {
      applicationTagOptions: [
        { tagName: "Behavioral Health", approvalStatus: "Approved" },
        { tagName: "Dental", approvalStatus: "Unapproved" },
      ],
    },
  },
};
describe("DemonstrationHealthTypeTags", () => {
  it("renders tags and apply button", async () => {
    render(
      <TestProvider mocks={[applicationTagOptionsMock]}>
        <DialogProvider>
          <DemonstrationHealthTypeTags
            demonstrationId="demo-123"
            title="STEP 3 - APPLY TAGS"
            description="You must tag this application with one or more demonstration types involved."
            selectedTags={[
              {
                tagName: "Behavioral Health",
                approvalStatus: "Approved",
              },
              { tagName: "Dental", approvalStatus: "Unapproved" },
            ]}
            onRemoveTag={() => {}}
          />
        </DialogProvider>
      </TestProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("STEP 3 - APPLY TAGS")).toBeInTheDocument();
    });
    expect(
      screen.getByText(
        "You must tag this application with one or more demonstration types involved."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Behavioral Health")).toBeInTheDocument();
    expect(screen.getByText("Dental (Unapproved)")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "button-apply-application-tags" })
    ).toBeInTheDocument();
  });

  it("calls onRemoveTag when a tag remove button is clicked", async () => {
    const user = userEvent.setup();
    const onRemoveTag = vi.fn();

    render(
      <TestProvider mocks={[applicationTagOptionsMock]}>
        <DialogProvider>
          <DemonstrationHealthTypeTags
            demonstrationId="demo-123"
            title="STEP 3 - APPLY TAGS"
            description="You must tag this application with one or more demonstration types involved."
            selectedTags={[
              {
                tagName: "Behavioral Health",
                approvalStatus: "Approved",
              },
              { tagName: "Dental", approvalStatus: "Unapproved" },
            ]}
            onRemoveTag={onRemoveTag}
          />
        </DialogProvider>
      </TestProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("STEP 3 - APPLY TAGS")).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText("Remove Dental"));
    expect(onRemoveTag).toHaveBeenCalledWith("Dental");
  });
});
