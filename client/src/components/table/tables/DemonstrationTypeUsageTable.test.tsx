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
import { DemonstrationTypeUsageTable, GET_DEMONSTRATION_TYPE_USAGE_QUERY } from "./DemonstrationTypeUsageTable";
import {
  APPROVE_TYPE_TAG_BUTTON_NAME,
  APPROVE_TYPE_TAG_DISABLED_TOOLTIP,
  APPROVE_TYPE_TAG_ENABLED_TOOLTIP,
  EDIT_TYPE_TAG_BUTTON_NAME,
  EDIT_TYPE_TAG_DISABLED_TOOLTIP,
  EDIT_TYPE_TAG_ENABLED_TOOLTIP,
} from "./TypeTagActionButtons";
import { ALL_MOCKS } from "mock-data";

const [FIRST_TYPE_TAG_NAME, SECOND_TYPE_TAG_NAME] = MOCK_DEMONSTRATION_TYPE_USAGE.map(
  (usage) => usage.demonstrationTypeName
);

const mocks = [
  ...ALL_MOCKS.filter(
    (mock) => mock.request.query !== GET_DEMONSTRATION_TYPE_USAGE_QUERY
  ),
  {
    request: {
      query: GET_DEMONSTRATION_TYPE_USAGE_QUERY,
    },
    result: {
      data: {
        demonstrationTypeUsageSummary: MOCK_DEMONSTRATION_TYPE_USAGE,
      },
    },
  },
];

const setup = () => {
  const user = userEvent.setup();
  console.log(
    MOCK_DEMONSTRATION_TYPE_USAGE.map((x) => ({
      name: x.demonstrationTypeName,
      total:
        x.countOfTaggedApplications.demonstrations +
        x.countOfTaggedApplications.amendments +
        x.countOfTaggedApplications.renewals +
        x.countOfAssignedDemonstrations +
        x.countOfAssignedDeliverables,
    }))
  );
  render(
    <TestProvider mocks={mocks}>
      <DialogProvider>
        <DemonstrationTypeUsageTable onSelectTypeTag={() => {}} />
      </DialogProvider>
    </TestProvider>
  );
  return user;
};

const getEditButton = () => screen.getByTestId(EDIT_TYPE_TAG_BUTTON_NAME);
const getApproveButton = () => screen.getByTestId(APPROVE_TYPE_TAG_BUTTON_NAME);

const selectTypeTag = async (user: ReturnType<typeof userEvent.setup>, typeTagName: string) =>
  user.click(
    within(await screen.findByRole("row", { name: new RegExp(typeTagName) })).getByRole("checkbox")
  );

describe("DemonstrationTypeUsageTable", () => {
  describe("Edit action", () => {
    it("is disabled with a selection prompt when no type/tag is selected", async () => {
      setup();

      await screen.findByRole("table");
      expect(getEditButton()).toBeDisabled();
      expect(getEditButton()).toHaveAttribute("title", EDIT_TYPE_TAG_DISABLED_TOOLTIP);
    });

    it("is enabled when exactly one type/tag is selected", async () => {
      const user = setup();

      await screen.findByRole("table");
      await selectTypeTag(user, FIRST_TYPE_TAG_NAME);

      expect(getEditButton()).toBeEnabled();
      expect(getEditButton()).toHaveAttribute("title", EDIT_TYPE_TAG_ENABLED_TOOLTIP);
    });

    it("is disabled with a selection prompt when more than one type/tag is selected", async () => {
      const user = setup();

      await screen.findByRole("table");
      await selectTypeTag(user, FIRST_TYPE_TAG_NAME);
      await selectTypeTag(user, SECOND_TYPE_TAG_NAME);

      expect(getEditButton()).toBeDisabled();
      expect(getEditButton()).toHaveAttribute("title", EDIT_TYPE_TAG_DISABLED_TOOLTIP);
    });

    it("opens the Edit Type/Tag dialog with the selected type/tag", async () => {
      const user = setup();

      await screen.findByRole("table");
      await selectTypeTag(user, FIRST_TYPE_TAG_NAME);
      await user.click(getEditButton());

      expect(screen.getByRole("heading", { name: EDIT_TYPE_TAG_DIALOG_TITLE })).toBeInTheDocument();
      expect(screen.getByTestId(TYPE_TAG_DISPLAY_TEXT_INPUT_NAME)).toHaveValue(FIRST_TYPE_TAG_NAME);
    });

    it("checks the new display text against the other type/tags in the table", async () => {
      const user = setup();

      await screen.findByRole("table");
      await selectTypeTag(user, FIRST_TYPE_TAG_NAME);
      await user.click(getEditButton());
      await user.clear(screen.getByTestId(TYPE_TAG_DISPLAY_TEXT_INPUT_NAME));
      await user.type(screen.getByTestId(TYPE_TAG_DISPLAY_TEXT_INPUT_NAME), SECOND_TYPE_TAG_NAME);

      expect(screen.getByText(DUPLICATE_TYPE_TAG_MESSAGE)).toBeInTheDocument();
    });
  });

  describe("Approve action", () => {
    it("is disabled with a selection prompt when no type/tag is selected", async () => {
      setup();

      await screen.findByRole("table");
      const approveButton = getApproveButton();
      expect(approveButton).toBeDisabled();
      expect(approveButton).toHaveAttribute("title", APPROVE_TYPE_TAG_DISABLED_TOOLTIP);
    });

    it("is disabled with a selection prompt when only approved type/tags are selected", async () => {
      const user = setup();

      await screen.findByRole("table");
      // FIRST_TYPE_TAG_NAME is approved
      await selectTypeTag(user, FIRST_TYPE_TAG_NAME);
      const approveButton = getApproveButton();
      expect(approveButton).toBeDisabled();
      expect(approveButton).toHaveAttribute("title", APPROVE_TYPE_TAG_DISABLED_TOOLTIP);
    });

    it("is enabled when at least one unapproved type/tag is selected", async () => {
      const user = setup();

      await screen.findByRole("table");
      // SECOND_TYPE_TAG_NAME is unapproved
      await selectTypeTag(user, SECOND_TYPE_TAG_NAME);
      const approveButton = getApproveButton();
      expect(approveButton).toBeEnabled();
      expect(approveButton).toHaveAttribute("title", APPROVE_TYPE_TAG_ENABLED_TOOLTIP);
    });

    it("is enabled when both approved and unapproved type/tags are selected", async () => {
      const user = setup();

      await screen.findByRole("table");
      // FIRST_TYPE_TAG_NAME is approved, SECOND_TYPE_TAG_NAME is unapproved
      await selectTypeTag(user, FIRST_TYPE_TAG_NAME);
      await selectTypeTag(user, SECOND_TYPE_TAG_NAME);
      const approveButton = getApproveButton();
      expect(approveButton).toBeEnabled();
      expect(approveButton).toHaveAttribute("title", APPROVE_TYPE_TAG_ENABLED_TOOLTIP);
    });

    it("opens the Approve Type/Tag dialog with the selected unapproved type/tags", async () => {
      const user = setup();

      await screen.findByRole("table");
      // FIRST_TYPE_TAG_NAME is approved, SECOND_TYPE_TAG_NAME is unapproved
      await selectTypeTag(user, FIRST_TYPE_TAG_NAME);
      await selectTypeTag(user, SECOND_TYPE_TAG_NAME);
      await user.click(getApproveButton());

      expect(
        screen.getByRole("heading", { name: "Approve Type/Tag(s)" })
      ).toBeInTheDocument();
      expect(screen.getByText(`${SECOND_TYPE_TAG_NAME}`)).toBeInTheDocument();
    });
  });

  describe("Delete action", () => {
    it("is disabled with a selection prompt when no type/tag is selected", async () => {
      setup();

      await screen.findByRole("table");
      const deleteButton = screen.getByTestId("delete-type-tag");
      expect(deleteButton).toBeDisabled();
      expect(deleteButton).toHaveAttribute("title", "Select a Type/Tag to Delete");
    });

    it("is disabled with a usage prompt when a type/tag with usage is selected", async () => {
      const user = setup();

      await screen.findByRole("table");
      // FIRST_TYPE_TAG_NAME has usage
      await selectTypeTag(user, FIRST_TYPE_TAG_NAME);
      const deleteButton = screen.getByTestId("delete-type-tag");
      expect(deleteButton).toBeDisabled();
      expect(deleteButton).toHaveAttribute("title", "Cannot Delete Type/Tag in use");
    });

    it("is enabled when exactly one type/tag without usage is selected", async () => {
      const user = setup();

      await screen.findByRole("table");
      // SECOND_TYPE_TAG_NAME has no usage
      await selectTypeTag(user, SECOND_TYPE_TAG_NAME);
      const deleteButton = screen.getByTestId("delete-type-tag");
      expect(deleteButton).toBeEnabled();
      expect(deleteButton).toHaveAttribute("title", "Delete");
    });

    it("is disabled when both type/tags with and without usage are selected", async () => {
      const user = setup();

      await screen.findByRole("table");
      // FIRST_TYPE_TAG_NAME has usage, SECOND_TYPE_TAG_NAME has no usage
      await selectTypeTag(user, FIRST_TYPE_TAG_NAME);
      await selectTypeTag(user, SECOND_TYPE_TAG_NAME);
      const deleteButton = screen.getByTestId("delete-type-tag");
      expect(deleteButton).toBeDisabled();
      expect(deleteButton).toHaveAttribute("title", "Cannot Delete Type/Tag in use");
    });
  });

  describe("Column Filter", () => {
    it("only shows Status as an available filter option", async () => {
      setup();

      await screen.findByRole("table");
      const selectElement = screen.getByTestId("filter-by-column") as HTMLSelectElement;
      const validOptions = Array.from(selectElement.querySelectorAll("option")).filter(
        (opt) => opt.value !== ""
      );

      expect(validOptions).toHaveLength(1);
      expect(validOptions[0]).toHaveTextContent("Status");
    });
  });
});
