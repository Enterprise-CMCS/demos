import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { CreateExtensionDialog, CREATE_EXTENSION_MUTATION } from "./CreateExtensionDialog";
import { BaseCreateModificationDialog } from "./BaseCreateModificationDialog";

const mockShowSuccess = vi.fn();
const mockShowError = vi.fn();
vi.mock("components/toast", () => ({
  useToast: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
  }),
}));

const mockHideDialog = vi.fn();
vi.mock("../DialogContext", () => ({
  useDialog: () => ({
    hideDialog: mockHideDialog,
  }),
}));

vi.mock("./BaseCreateModificationDialog", () => ({
  BaseCreateModificationDialog: vi.fn(({ handleSubmit, modificationType }) => {
    return (
      <div data-testid="base-dialog">
        <h1>{modificationType}</h1>
        <button
          onClick={() =>
            handleSubmit({
              name: "Test Extension",
              description: "Test Description",
              demonstrationId: "demo-123",
            })
          }
        >
          Submit
        </button>
      </div>
    );
  }),
}));

describe("CreateExtensionDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders BaseCreateModificationDialog with correct props", () => {
    const mocks = [
      {
        request: {
          query: CREATE_EXTENSION_MUTATION,
          variables: {
            input: {
              name: "Test Extension",
              description: "Test Description",
              demonstrationId: "demo-123",
            },
          },
        },
        result: {
          data: {
            createExtension: {
              id: "extension-1",
              demonstration: {
                id: "demo-123",
                extensions: [{ id: "extension-1" }],
              },
            },
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <CreateExtensionDialog initialDemonstrationId="demo-123" />
      </MockedProvider>
    );

    expect(screen.getByTestId("base-dialog")).toBeInTheDocument();
    expect(screen.getByText("Extension")).toBeInTheDocument();
  });

  it("successfully creates an extension and shows success message", async () => {
    const mocks = [
      {
        request: {
          query: CREATE_EXTENSION_MUTATION,
          variables: {
            input: {
              name: "Test Extension",
              description: "Test Description",
              demonstrationId: "demo-123",
            },
          },
        },
        result: {
          data: {
            createExtension: {
              id: "extension-1",
              demonstration: {
                id: "demo-123",
                extensions: [{ id: "extension-1" }],
              },
            },
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <CreateExtensionDialog initialDemonstrationId="demo-123" />
      </MockedProvider>
    );

    const submitButton = screen.getByRole("button", { name: "Submit" });
    submitButton.click();

    await waitFor(() => {
      expect(mockShowSuccess).toHaveBeenCalledWith("Extension created successfully.");
      expect(mockHideDialog).toHaveBeenCalled();
    });
  });

  it("handles mutation error and shows error message", async () => {
    const mocks = [
      {
        request: {
          query: CREATE_EXTENSION_MUTATION,
          variables: {
            input: {
              name: "Test Extension",
              description: "Test Description",
              demonstrationId: "demo-123",
            },
          },
        },
        error: new Error("Network error"),
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <CreateExtensionDialog initialDemonstrationId="demo-123" />
      </MockedProvider>
    );

    const submitButton = screen.getByRole("button", { name: "Submit" });
    submitButton.click();

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith("Error creating extension.");
      expect(mockHideDialog).toHaveBeenCalled();
    });
  });

  it("handles missing data in response and shows error message", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const mocks = [
      {
        request: {
          query: CREATE_EXTENSION_MUTATION,
          variables: {
            input: {
              name: "Test Extension",
              description: "Test Description",
              demonstrationId: "demo-123",
            },
          },
        },
        result: {
          data: {
            createExtension: null,
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <CreateExtensionDialog initialDemonstrationId="demo-123" />
      </MockedProvider>
    );

    const submitButton = screen.getByRole("button", { name: "Submit" });
    submitButton.click();

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith("Error creating extension.");
      expect(consoleErrorSpy).toHaveBeenCalledWith("Unknown error");
      expect(mockHideDialog).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });

  it("passes initialDemonstrationId to BaseCreateModificationDialog", () => {
    const mocks = [
      {
        request: {
          query: CREATE_EXTENSION_MUTATION,
          variables: {
            input: {
              name: "Test Extension",
              description: "Test Description",
              demonstrationId: "demo-123",
            },
          },
        },
        result: {
          data: {
            createExtension: {
              id: "extension-1",
              demonstration: {
                id: "demo-123",
                extensions: [{ id: "extension-1" }],
              },
            },
          },
        },
      },
    ];
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <CreateExtensionDialog initialDemonstrationId="demo-456" />
      </MockedProvider>
    );

    // The mock implementation will receive the props
    expect(BaseCreateModificationDialog).toHaveBeenCalledWith(
      expect.objectContaining({
        initialDemonstrationId: "demo-456",
        modificationType: "Extension",
      }),
      undefined
    );
  });
});
