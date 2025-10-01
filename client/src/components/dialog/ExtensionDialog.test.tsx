import React from "react";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { GraphQLError } from "graphql";
import { vi } from "vitest";

import { ExtensionDialog, EXTENSION_DIALOG_QUERY } from "./ExtensionDialog";
import { TestProvider } from "test-utils/TestProvider";

const EXTENSION_ID = "extension-123";

const extensionMock = {
  request: {
    query: EXTENSION_DIALOG_QUERY,
    variables: { id: EXTENSION_ID },
  },
  result: {
    data: {
      extension: {
        id: EXTENSION_ID,
        name: "Test Extension",
        description: "This is a test extension.",
        effectiveDate: "2025-02-01T00:00:00.000Z",
        expirationDate: null,
        status: "Approved",
        currentPhaseName: "Implementation",
        demonstration: {
          id: "demo-2",
          name: "Demo 2",
          __typename: "Demonstration",
        },
        __typename: "Extension",
      },
    },
  },
};

const errorMock = {
  request: {
    query: EXTENSION_DIALOG_QUERY,
    variables: { id: EXTENSION_ID },
  },
  result: {
    errors: [new GraphQLError("Boom")],
  },
};

describe("ExtensionDialog", () => {
  it("renders extension details in view mode", async () => {
    render(
      <TestProvider mocks={[extensionMock]}>
        <ExtensionDialog extensionId={EXTENSION_ID} isOpen={true} onClose={() => {}} mode="view" />
      </TestProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Test Extension")).toBeInTheDocument();
    });

    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Timeline")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Approved")).toBeInTheDocument();
    expect(screen.getByText("Implementation")).toBeInTheDocument();
    expect(screen.getByText("Demo 2")).toBeInTheDocument();
    expect(screen.getByText("This is a test extension.")).toBeInTheDocument();
    expect(screen.getByText("Expanded details coming soon.")).toBeInTheDocument();

    const titleInput = screen.getByLabelText("Extension Title") as HTMLInputElement;
    expect(titleInput).toBeDisabled();
    expect(titleInput.value).toBe("Test Extension");

    expect(screen.getByTestId("extension-effective-date-display")).toHaveValue("02/01/2025");
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("allows editing when mode is edit", async () => {
    const onClose = vi.fn();

    render(
      <TestProvider mocks={[extensionMock]}>
        <ExtensionDialog extensionId={EXTENSION_ID} isOpen={true} onClose={onClose} mode="edit" />
      </TestProvider>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("Test Extension")).toBeInTheDocument();
    });

    const descriptionTextarea = screen.getByPlaceholderText("Add a description") as HTMLTextAreaElement;
    expect(descriptionTextarea.readOnly).toBe(false);

    fireEvent.change(descriptionTextarea, { target: { value: "Updated description" } });
    expect(descriptionTextarea.value).toBe("Updated description");
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  });

  it("shows an error message when the query fails", async () => {
    render(
      <TestProvider mocks={[errorMock]}>
        <ExtensionDialog extensionId={EXTENSION_ID} isOpen={true} onClose={() => {}} mode="view" />
      </TestProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Failed to load extension.")).toBeInTheDocument();
    });
  });

  it("renders create form when mode is add", () => {
    render(
      <TestProvider>
        <ExtensionDialog isOpen={true} onClose={() => {}} mode="add" />
      </TestProvider>
    );

    expect(screen.getByText("New Extension")).toBeInTheDocument();
  });
});
