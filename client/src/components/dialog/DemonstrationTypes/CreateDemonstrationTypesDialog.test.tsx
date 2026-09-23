import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MockedProvider, MockedResponse } from "@apollo/client/testing";

import { SELECT_DEMONSTRATION_TYPE_QUERY } from "components/input/select/SelectDemonstrationType";
import { CreateDemonstrationTypesDialog } from "./CreateDemonstrationTypesDialog";
import {
  CREATE_DEMONSTRATION_TYPES_FORM_QUERY,
} from "./CreateDemonstrationTypesForm";

const mockCloseDialog = vi.fn();
vi.mock("../DialogContext", () => ({
  useDialog: () => ({
    closeDialog: mockCloseDialog,
  }),
}));

describe("CreateDemonstrationTypesDialog", () => {
  const mocks: MockedResponse[] = [
    {
      request: {
        query: SELECT_DEMONSTRATION_TYPE_QUERY,
      },
      result: {
        data: {
          demonstrationTypeOptions: [
            { tagName: "Type A", approvalStatus: "Approved" },
            { tagName: "Type B", approvalStatus: "Unapproved" },
          ],
        },
      },
    },
    {
      request: {
        query: CREATE_DEMONSTRATION_TYPES_FORM_QUERY,
      },
      result: {
        data: {
          demonstrationTypeOptions: [
            { tagName: "Type A" },
            { tagName: "Type B" },
          ],
        },
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderDialog = async () => {
    render(
      <MockedProvider mocks={mocks}>
        <CreateDemonstrationTypesDialog />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("Type to search...")
      ).toBeInTheDocument();
    });
  };

  it("renders the dialog title", async () => {
    await renderDialog();

    expect(
      screen.getByText("Create New Tag/Type(s)")
    ).toBeInTheDocument();
  });

  it("renders Save button disabled initially", async () => {
    await renderDialog();

    expect(
      screen.getByRole("button", { name: "button-save-demonstration-types" })
    ).toBeDisabled();
  });

  it("renders Cancel button", async () => {
    await renderDialog();

    expect(
      screen.getByRole("button", {
        name: "Cancel and close dialog",
      })
    ).toBeInTheDocument();
  });

  it("enables Save after adding a new type", async () => {
    const user = userEvent.setup();

    await renderDialog();

    const input = screen.getByPlaceholderText("Type to search...");

    await user.type(input, "Brand New Type");

    await user.click(screen.getByRole("button", { name: "button-create-demonstration-type" }));

    await user.click(
      screen.getByRole("button", { name: "button-add-demonstration-type" })
    );

    expect(
      screen.getByRole("button", { name: "button-save-demonstration-types" })
    ).toBeEnabled();
  });

  it("shows the added type in the list", async () => {
    const user = userEvent.setup();

    await renderDialog();

    const input = screen.getByPlaceholderText("Type to search...");

    await user.type(input, "Brand New Type");

    await user.click(screen.getByRole("button", { name: "button-create-demonstration-type" }));

    await user.click(
      screen.getByRole("button", { name: "button-add-demonstration-type" })
    );

    expect(
      screen.getByText("Brand New Type (Unapproved)")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Types to be added (1)")
    ).toBeInTheDocument();
  });

  it("enables Save when multiple new types are added", async () => {
    const user = userEvent.setup();

    await renderDialog();

    const input = screen.getByPlaceholderText("Type to search...");
    const createButton = screen.getByRole("button", {
      name: "button-create-demonstration-type",
    });
    const addButton = screen.getByRole("button", {
      name: "button-add-demonstration-type",
    });

    await user.type(input, "First New Type");

    await user.click(createButton);
    await user.click(addButton);

    await user.type(input, "Second New Type");

    await user.click(createButton);
    await user.click(addButton);

    expect(
      screen.getByText("Types to be added (2)")
    ).toBeInTheDocument();

    expect(
      screen.getByText("First New Type (Unapproved)")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Second New Type (Unapproved)")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "button-save-demonstration-types" })
    ).toBeEnabled();
  });

  it("disables Save after the only added type is removed", async () => {
    const user = userEvent.setup();

    await renderDialog();

    const input = screen.getByPlaceholderText("Type to search...");

    await user.type(input, "Brand New Type");

    await user.click(screen.getByRole("button", { name: "button-create-demonstration-type" }));

    await user.click(
      screen.getByRole("button", { name: "button-add-demonstration-type" })
    );

    expect(
      screen.getByRole("button", { name: "button-save-demonstration-types" })
    ).toBeEnabled();

    const listItem = screen
      .getByText("Brand New Type (Unapproved)")
      .closest("li");

    expect(listItem).not.toBeNull();

    await user.click(
      within(listItem!).getByRole("button", { name: "Delete" })
    );

    expect(
      screen.getByRole("button", { name: "button-save-demonstration-types" })
    ).toBeDisabled();

    expect(
      screen.queryByText("Types to be added (1)")
    ).not.toBeInTheDocument();
  });

  it("removes only the selected type", async () => {
    const user = userEvent.setup();

    await renderDialog();

    const input = screen.getByPlaceholderText("Type to search...");
    const createButton = screen.getByRole("button", {
      name: "button-create-demonstration-type",
    });
    const addButton = screen.getByRole("button", {
      name: "button-add-demonstration-type",
    });

    await user.type(input, "First New Type");
    await user.click(createButton);
    await user.click(addButton);

    await user.type(input, "Second New Type");
    await user.click(createButton);
    await user.click(addButton);

    const firstItem = screen
      .getByText("First New Type (Unapproved)")
      .closest("li");

    expect(firstItem).not.toBeNull();

    await user.click(
      within(firstItem!).getByRole("button", { name: "Delete" })
    );

    expect(
      screen.queryByText("First New Type (Unapproved)")
    ).not.toBeInTheDocument();

    expect(
      screen.getByText("Second New Type (Unapproved)")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Types to be added (1)")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "button-save-demonstration-types" })
    ).toBeEnabled();
  });

  it("does not close or perform a mutation when Save is clicked", async () => {
    const user = userEvent.setup();

    await renderDialog();

    const input = screen.getByPlaceholderText("Type to search...");

    await user.type(input, "Brand New Type");

    await user.click(screen.getByRole("button", { name: "button-create-demonstration-type" }));

    await user.click(
      screen.getByRole("button", { name: "button-add-demonstration-type" })
    );

    const saveButton = screen.getByRole("button", { name: "button-save-demonstration-types" });

    expect(saveButton).toBeEnabled();

    await user.click(saveButton);

    expect(
      screen.getByText("Brand New Type (Unapproved)")
    ).toBeInTheDocument();
  });
});
