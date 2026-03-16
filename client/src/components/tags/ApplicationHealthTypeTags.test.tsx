import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  ApplicationHealthTypeTags,
  GET_APPLICATION_TAG_OPTIONS,
} from "./ApplicationHealthTypeTags";
import { DialogProvider } from "components/dialog/DialogContext";
import { MockedResponse } from "@apollo/client/testing";
import { TestProvider } from "test-utils/TestProvider";

const { mockShowApplyTagsDialog } = vi.hoisted(() => ({
  mockShowApplyTagsDialog: vi.fn(),
}));

vi.mock("components/dialog/DialogContext", async () => {
  const actual = await vi.importActual("components/dialog/DialogContext");
  return {
    ...actual,
    useDialog: () => ({
      showApplyTagsDialog: mockShowApplyTagsDialog,
    }),
  };
});

const applicationTagOptionsMock: MockedResponse = {
  request: {
    query: GET_APPLICATION_TAG_OPTIONS,
  },
  result: {
    data: {
      applicationTagOptions: [
        { tagName: "Waiver Services", approvalStatus: "Approved" },
        { tagName: "Dental", approvalStatus: "Unapproved" },
        { tagName: "Aged Care", approvalStatus: "Approved" },
        { tagName: "Behavioral Health", approvalStatus: "Approved" },
        { tagName: "CHIP", approvalStatus: "Unapproved" },
      ],
    },
  },
};
describe("DemonstrationHealthTypeTags", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders tags and apply button and passes sorted options to dialog", async () => {
    const user = userEvent.setup();

    render(
      <TestProvider mocks={[applicationTagOptionsMock]}>
        <DialogProvider>
          <ApplicationHealthTypeTags
            applicationId="demo-123"
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

    await user.click(screen.getByRole("button", { name: "button-apply-application-tags" }));

    expect(mockShowApplyTagsDialog).toHaveBeenCalledTimes(1);
    const sortedOptions = mockShowApplyTagsDialog.mock.calls[0][1] as Array<{ tagName: string }>;
    expect(sortedOptions.map((tag) => tag.tagName)).toEqual([
      "Aged Care",
      "Behavioral Health",
      "CHIP",
      "Dental",
      "Waiver Services",
    ]);
  });

  it("calls onRemoveTag when a tag remove button is clicked", async () => {
    const user = userEvent.setup();
    const onRemoveTag = vi.fn();

    render(
      <TestProvider mocks={[applicationTagOptionsMock]}>
        <DialogProvider>
          <ApplicationHealthTypeTags
            applicationId="demo-123"
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
