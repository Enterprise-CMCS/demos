import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  APPROVAL_WARNING_TEXT,
  APPROVE_TYPE_TAG_BUTTON_NAME,
  APPROVE_TYPE_TAG_DIALOG_TITLE,
  ApproveTypeTagDialog,
} from "./ApproveTypeTagDialog";
import { GET_DEMONSTRATION_TYPE_USAGE_QUERY } from "components/table/tables/DemonstrationTypeUsageTable";
import { TestProvider } from "test-utils/TestProvider";

const FIRST_TYPE_TAG_NAME = "1115 Waiver";
const SECOND_TYPE_TAG_NAME = "Type B";
const THIRD_TYPE_TAG_NAME = "Type C";

const mockMutate = vi.fn(() => Promise.resolve({ data: {} }));
vi.mock("@apollo/client", async () => {
  const actual = await vi.importActual("@apollo/client");
  return {
    ...actual,
    useMutation: vi.fn(() => [mockMutate]),
  };
});

const setup = (typeTagNames = [FIRST_TYPE_TAG_NAME]) => {
  const user = userEvent.setup();
  const onClose = vi.fn();

  render(
    <TestProvider>
      <ApproveTypeTagDialog
        typeTagNames={typeTagNames}
        onClose={onClose}
      />
    </TestProvider>
  );

  return { user, onClose };
};

const getApproveButton = () => screen.getByTestId(APPROVE_TYPE_TAG_BUTTON_NAME);

describe("ApproveTypeTagDialog", () => {
  it("shows correct approval confirmation for a single type/tag", () => {
    setup();

    expect(
      screen.getByRole("heading", {
        name: APPROVE_TYPE_TAG_DIALOG_TITLE,
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText(`Are you sure you want to approve "${FIRST_TYPE_TAG_NAME}"?`)
    ).toBeInTheDocument();
  });

  it("shows each selected type/tag when multiple are selected", () => {
    setup([
      FIRST_TYPE_TAG_NAME,
      SECOND_TYPE_TAG_NAME,
      THIRD_TYPE_TAG_NAME,
    ]);

    expect(screen.getByText("Are you sure you want to approve the types/tags?")).toBeInTheDocument();
    expect(screen.getByText(`"${FIRST_TYPE_TAG_NAME}"`)).toBeInTheDocument();
    expect(screen.getByText(`"${SECOND_TYPE_TAG_NAME}"`)).toBeInTheDocument();
    expect(screen.getByText(`"${THIRD_TYPE_TAG_NAME}"`)).toBeInTheDocument();
  });

  it("shows the permanent approval warning", () => {
    setup();
    expect(screen.getByText(APPROVAL_WARNING_TEXT)).toBeInTheDocument();
  });

  it("enables the Approve button", () => {
    setup();
    expect(getApproveButton()).toBeEnabled();
  });

  it("calls the approveTags mutator with the correct value when Approve is clicked", async () => {
    const { user, onClose } = setup();

    await user.click(getApproveButton());

    expect(onClose).toHaveBeenCalledOnce();
    expect(mockMutate).toHaveBeenCalledWith({
      variables: { tagNames: [FIRST_TYPE_TAG_NAME] },
      refetchQueries: [GET_DEMONSTRATION_TYPE_USAGE_QUERY],
    });
  });
});
