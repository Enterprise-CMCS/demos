import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { TestProvider } from "test-utils/TestProvider";
import { DialogProvider } from "components/dialog/DialogContext";
import {
  DUPLICATE_TYPE_TAG_MESSAGE,
  EDIT_TYPE_TAG_DIALOG_TITLE,
  TYPE_TAG_DISPLAY_TEXT_INPUT_NAME,
} from "components/dialog/typeTag/EditTypeTagDialog";
import { MOCK_DEMONSTRATION_TYPE_USAGE } from "mock-data/demonstrationTypeUsageMocks";
import { DemonstrationTypeUsageTable } from "./DemonstrationTypeUsageTable";
import {
  EDIT_TYPE_TAG_BUTTON_NAME,
  EDIT_TYPE_TAG_DISABLED_TOOLTIP,
  EDIT_TYPE_TAG_ENABLED_TOOLTIP,
} from "./TypeTagActionButtons";

const [FIRST_TYPE_TAG_NAME, SECOND_TYPE_TAG_NAME] = MOCK_DEMONSTRATION_TYPE_USAGE.map(
  (usage) => usage.demonstrationTypeName
);

const setup = () => {
  const user = userEvent.setup();
  render(
    <TestProvider>
      <DialogProvider>
        <DemonstrationTypeUsageTable onSelectTypeTag={() => {}} />
      </DialogProvider>
    </TestProvider>
  );
  return user;
};

const getEditButton = () => screen.getByTestId(EDIT_TYPE_TAG_BUTTON_NAME);

const selectTypeTag = (user: ReturnType<typeof userEvent.setup>, typeTagName: string) =>
  user.click(
    within(screen.getByRole("row", { name: new RegExp(typeTagName) })).getByRole("checkbox")
  );

describe("DemonstrationTypeUsageTable", () => {
  describe("Edit action", () => {
    it("is disabled with a selection prompt when no type/tag is selected", () => {
      setup();

      expect(getEditButton()).toBeDisabled();
      expect(getEditButton()).toHaveAttribute("title", EDIT_TYPE_TAG_DISABLED_TOOLTIP);
    });

    it("is enabled when exactly one type/tag is selected", async () => {
      const user = setup();

      await selectTypeTag(user, FIRST_TYPE_TAG_NAME);

      expect(getEditButton()).toBeEnabled();
      expect(getEditButton()).toHaveAttribute("title", EDIT_TYPE_TAG_ENABLED_TOOLTIP);
    });

    it("is disabled with a selection prompt when more than one type/tag is selected", async () => {
      const user = setup();

      await selectTypeTag(user, FIRST_TYPE_TAG_NAME);
      await selectTypeTag(user, SECOND_TYPE_TAG_NAME);

      expect(getEditButton()).toBeDisabled();
      expect(getEditButton()).toHaveAttribute("title", EDIT_TYPE_TAG_DISABLED_TOOLTIP);
    });

    it("opens the Edit Type/Tag dialog with the selected type/tag", async () => {
      const user = setup();

      await selectTypeTag(user, FIRST_TYPE_TAG_NAME);
      await user.click(getEditButton());

      expect(screen.getByRole("heading", { name: EDIT_TYPE_TAG_DIALOG_TITLE })).toBeInTheDocument();
      expect(screen.getByTestId(TYPE_TAG_DISPLAY_TEXT_INPUT_NAME)).toHaveValue(FIRST_TYPE_TAG_NAME);
    });

    it("checks the new display text against the other type/tags in the table", async () => {
      const user = setup();

      await selectTypeTag(user, FIRST_TYPE_TAG_NAME);
      await user.click(getEditButton());
      await user.clear(screen.getByTestId(TYPE_TAG_DISPLAY_TEXT_INPUT_NAME));
      await user.type(screen.getByTestId(TYPE_TAG_DISPLAY_TEXT_INPUT_NAME), SECOND_TYPE_TAG_NAME);

      expect(screen.getByText(DUPLICATE_TYPE_TAG_MESSAGE)).toBeInTheDocument();
    });
  });
});
