import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { TestProvider } from "test-utils/TestProvider";
import { MOCK_TYPE_TAG_ASSOCIATED_RECORDS_DEMONSTRATION } from "mock-data/demonstrationMocks";
import { TypeTagManagement } from "./TypeTagManagement";
import {
  BACK_TO_TYPE_TAG_MANAGEMENT_BUTTON_NAME,
  TYPE_TAG_ASSOCIATED_RECORDS_TEST_ID,
} from "./TypeTagAssociatedRecords";
import { TYPE_TAG_SEARCH_PARAM } from "./useSelectedTypeTag";

const ASSOCIATED_TAG_NAME = MOCK_TYPE_TAG_ASSOCIATED_RECORDS_DEMONSTRATION.tags[0].tagName;
const ASSOCIATED_RECORDS_ENTRY =
  `/admin?${TYPE_TAG_SEARCH_PARAM}=${encodeURIComponent(ASSOCIATED_TAG_NAME)}`;

const setup = (routerEntry = "/admin") =>
  render(
    <TestProvider routerEntries={[routerEntry]}>
      <TypeTagManagement />
    </TestProvider>
  );

describe("TypeTagManagement", () => {
  it("lists types/tags when none is selected", async () => {
    setup();

    expect(await screen.findByText(ASSOCIATED_TAG_NAME)).toBeInTheDocument();
    expect(screen.queryByTestId(TYPE_TAG_ASSOCIATED_RECORDS_TEST_ID)).not.toBeInTheDocument();
  });

  it("opens the associated records view when View is selected", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(await screen.findByTestId(`view-type-tag-${ASSOCIATED_TAG_NAME}`));

    expect(await screen.findByTestId(TYPE_TAG_ASSOCIATED_RECORDS_TEST_ID)).toBeInTheDocument();
    expect(screen.getByText("Type/Tag File View")).toBeInTheDocument();
    expect(
      (await screen.findAllByText(MOCK_TYPE_TAG_ASSOCIATED_RECORDS_DEMONSTRATION.name)).length
    ).toBeGreaterThan(0);
  });

  it("returns to the type/tag list from the back link", async () => {
    const user = userEvent.setup();
    setup(ASSOCIATED_RECORDS_ENTRY);

    await user.click(await screen.findByTestId(BACK_TO_TYPE_TAG_MANAGEMENT_BUTTON_NAME));

    expect(await screen.findByTestId(`view-type-tag-${ASSOCIATED_TAG_NAME}`)).toBeInTheDocument();
    expect(screen.queryByTestId(TYPE_TAG_ASSOCIATED_RECORDS_TEST_ID)).not.toBeInTheDocument();
  });
});
