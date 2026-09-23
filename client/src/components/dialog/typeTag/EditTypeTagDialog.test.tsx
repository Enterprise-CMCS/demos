import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  MOCK_1115_WAIVER,
  MOCK_DEMONSTRATION_TYPE_USAGE,
} from "mock-data/demonstrationTypeUsageMocks";
import { DIALOG_CANCEL_BUTTON_NAME } from "components/dialog/BaseDialog";
import {
  DUPLICATE_TYPE_TAG_MESSAGE,
  EDIT_TYPE_TAG_DIALOG_TITLE,
  EditTypeTagDialog,
  SAVE_TYPE_TAG_BUTTON_NAME,
  TYPE_TAG_DISPLAY_TEXT_INPUT_NAME,
} from "./EditTypeTagDialog";

const TYPE_TAG_NAME = MOCK_1115_WAIVER.demonstrationTypeName;
const EXISTING_TYPE_TAG_NAMES = MOCK_DEMONSTRATION_TYPE_USAGE.map(
  (usage) => usage.demonstrationTypeName
);
const OTHER_TYPE_TAG_NAME = EXISTING_TYPE_TAG_NAMES[1];
const UNIQUE_TYPE_TAG_NAME = "Substance Use Disorder (SUD)";

const setup = () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  render(
    <EditTypeTagDialog
      typeTagName={TYPE_TAG_NAME}
      existingTypeTagNames={EXISTING_TYPE_TAG_NAMES}
      onClose={onClose}
    />
  );
  return { user, onClose };
};

const getDisplayTextInput = () => screen.getByTestId(TYPE_TAG_DISPLAY_TEXT_INPUT_NAME);
const getSaveButton = () => screen.getByTestId(SAVE_TYPE_TAG_BUTTON_NAME);

const replaceDisplayText = async (user: ReturnType<typeof userEvent.setup>, text: string) => {
  await user.clear(getDisplayTextInput());
  if (text) {
    await user.type(getDisplayTextInput(), text);
  }
};

describe("EditTypeTagDialog", () => {
  it("shows the selected type/tag's display text under the Edit Type/Tag title", () => {
    setup();

    expect(screen.getByRole("heading", { name: EDIT_TYPE_TAG_DIALOG_TITLE })).toBeInTheDocument();
    expect(getDisplayTextInput()).toHaveValue(TYPE_TAG_NAME);
  });

  it("disables Save Changes until the display text changes", async () => {
    const { user } = setup();

    expect(getSaveButton()).toBeDisabled();

    await replaceDisplayText(user, UNIQUE_TYPE_TAG_NAME);

    expect(getSaveButton()).toBeEnabled();
  });

  it("blocks saving a display text that matches another type/tag", async () => {
    const { user } = setup();

    await replaceDisplayText(user, OTHER_TYPE_TAG_NAME);

    expect(screen.getByText(DUPLICATE_TYPE_TAG_MESSAGE)).toBeInTheDocument();
    expect(getSaveButton()).toBeDisabled();
  });

  it("treats differences in case and surrounding whitespace as duplicates", async () => {
    const { user } = setup();

    await replaceDisplayText(user, `  ${OTHER_TYPE_TAG_NAME.toLowerCase()} `);

    expect(screen.getByText(DUPLICATE_TYPE_TAG_MESSAGE)).toBeInTheDocument();
    expect(getSaveButton()).toBeDisabled();
  });

  it("clears the duplicate error once the display text is unique", async () => {
    const { user } = setup();

    await replaceDisplayText(user, OTHER_TYPE_TAG_NAME);
    await replaceDisplayText(user, UNIQUE_TYPE_TAG_NAME);

    expect(screen.queryByText(DUPLICATE_TYPE_TAG_MESSAGE)).not.toBeInTheDocument();
    expect(getSaveButton()).toBeEnabled();
  });

  it("allows correcting the casing of the selected type/tag", async () => {
    const { user } = setup();

    await replaceDisplayText(user, TYPE_TAG_NAME.toLowerCase());

    expect(screen.queryByText(DUPLICATE_TYPE_TAG_MESSAGE)).not.toBeInTheDocument();
    expect(getSaveButton()).toBeEnabled();
  });

  it("disables Save Changes when the display text is blank", async () => {
    const { user } = setup();

    await replaceDisplayText(user, "");

    expect(getSaveButton()).toBeDisabled();
  });

  it("closes when Save Changes is selected", async () => {
    const { user, onClose } = setup();

    await replaceDisplayText(user, UNIQUE_TYPE_TAG_NAME);
    await user.click(getSaveButton());

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("closes without confirmation when Cancel is selected before any change", async () => {
    const { user, onClose } = setup();

    await user.click(screen.getByTestId(DIALOG_CANCEL_BUTTON_NAME));

    expect(onClose).toHaveBeenCalledOnce();
  });
});
