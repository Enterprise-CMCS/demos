import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  DELETE_TYPE_TAG_BUTTON_NAME,
  DELETE_TYPE_TAG_DIALOG_TITLE,
  DELETE_TYPE_TAG_WARNING_TEXT,
  DeleteTypeTagDialog,
} from "./DeleteTypeTagDialog";
import { GET_DEMONSTRATION_TYPE_USAGE_QUERY } from "components/table";

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

vi.mock("components/toast", () => ({
  useToast: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
}));

const setup = (typeTagNames = [FIRST_TYPE_TAG_NAME]) => {
  const user = userEvent.setup();
  const onClose = vi.fn();

  render(
    <DeleteTypeTagDialog
      typeTagNames={typeTagNames}
      onClose={onClose}
    />
  );

  return { user, onClose };
};

const getDeleteButton = () => screen.getByTestId(DELETE_TYPE_TAG_BUTTON_NAME);

describe("DeleteTypeTagDialog", () => {
  it("shows correct delete confirmation for a single type/tag", () => {
    setup();

    expect(
      screen.getByRole("heading", {
        name: DELETE_TYPE_TAG_DIALOG_TITLE,
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText(`Are you sure you want to remove "${FIRST_TYPE_TAG_NAME}"?`)
    ).toBeInTheDocument();
  });

  it("shows each selected type/tag when multiple are selected", () => {
    setup([
      FIRST_TYPE_TAG_NAME,
      SECOND_TYPE_TAG_NAME,
      THIRD_TYPE_TAG_NAME,
    ]);

    expect(screen.getByText("Are you sure you want to remove the types/tags?")).toBeInTheDocument();
    expect(screen.getByText(`"${FIRST_TYPE_TAG_NAME}"`)).toBeInTheDocument();
    expect(screen.getByText(`"${SECOND_TYPE_TAG_NAME}"`)).toBeInTheDocument();
    expect(screen.getByText(`"${THIRD_TYPE_TAG_NAME}"`)).toBeInTheDocument();
  });

  it("shows the permanent delete warning", () => {
    setup();
    expect(screen.getByText(DELETE_TYPE_TAG_WARNING_TEXT)).toBeInTheDocument();
  });

  it("enables the Delete button", () => {
    setup();
    expect(getDeleteButton()).toBeEnabled();
  });

  it("closes when Delete is selected", async () => {
    const { user, onClose } = setup();

    await user.click(getDeleteButton());

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls the delete mutation with the correct type/tag names when delete is clicked", async () => {
    const { user } = setup([FIRST_TYPE_TAG_NAME, SECOND_TYPE_TAG_NAME]);

    await user.click(getDeleteButton());

    expect(mockMutate).toHaveBeenCalledWith({
      variables: {
        tagNames: [FIRST_TYPE_TAG_NAME, SECOND_TYPE_TAG_NAME],
      },
      refetchQueries: [GET_DEMONSTRATION_TYPE_USAGE_QUERY],
    });
  });
});
