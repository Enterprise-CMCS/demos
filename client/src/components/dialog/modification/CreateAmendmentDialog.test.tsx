import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { CreateAmendmentDialog, CREATE_AMENDMENT_MUTATION } from "./CreateAmendmentDialog";
import { BaseCreateModificationDialog } from "./BaseCreateModificationDialog";

const mockShowSuccess = vi.fn();
const mockShowError = vi.fn();
vi.mock("components/toast", () => ({
  useToast: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
  }),
}));

const mockOnClose = vi.fn();

vi.mock("./BaseCreateModificationDialog", () => ({
  BaseCreateModificationDialog: vi.fn(({ handleSubmit, modificationType }) => {
    return (
      <div data-testid="base-dialog">
        <h1>{modificationType}</h1>
        <button
          onClick={() =>
            handleSubmit({
              name: "Test Amendment",
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

describe("CreateAmendmentDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders BaseCreateModificationDialog with correct props", () => {
    const mocks = [
      {
        request: {
          query: CREATE_AMENDMENT_MUTATION,
          variables: {
            input: {
              name: "Test Amendment",
              description: "Test Description",
              demonstrationId: "demo-123",
            },
          },
        },
        result: {
          data: {
            createAmendment: {
              id: "amendment-1",
              demonstration: {
                id: "demo-123",
                amendments: [{ id: "amendment-1" }],
              },
            },
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <CreateAmendmentDialog onClose={mockOnClose} initialDemonstrationId="demo-123" />
      </MockedProvider>
    );

    expect(screen.getByTestId("base-dialog")).toBeInTheDocument();
    expect(screen.getByText("Amendment")).toBeInTheDocument();
  });

  it("successfully creates an amendment and shows success message", async () => {
    const mocks = [
      {
        request: {
          query: CREATE_AMENDMENT_MUTATION,
          variables: {
            input: {
              name: "Test Amendment",
              description: "Test Description",
              demonstrationId: "demo-123",
            },
          },
        },
        result: {
          data: {
            createAmendment: {
              id: "amendment-1",
              demonstration: {
                id: "demo-123",
                amendments: [{ id: "amendment-1" }],
              },
            },
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <CreateAmendmentDialog onClose={mockOnClose} initialDemonstrationId="demo-123" />
      </MockedProvider>
    );

    const submitButton = screen.getByRole("button", { name: "Submit" });
    submitButton.click();

    await waitFor(() => {
      expect(mockShowSuccess).toHaveBeenCalledWith("Amendment created successfully.");
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("handles mutation error and shows error message", async () => {
    const mocks = [
      {
        request: {
          query: CREATE_AMENDMENT_MUTATION,
          variables: {
            input: {
              name: "Test Amendment",
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
        <CreateAmendmentDialog onClose={mockOnClose} initialDemonstrationId="demo-123" />
      </MockedProvider>
    );

    const submitButton = screen.getByRole("button", { name: "Submit" });
    submitButton.click();

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith("Error creating amendment.");
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("handles missing data in response and shows error message", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const mocks = [
      {
        request: {
          query: CREATE_AMENDMENT_MUTATION,
          variables: {
            input: {
              name: "Test Amendment",
              description: "Test Description",
              demonstrationId: "demo-123",
            },
          },
        },
        result: {
          data: {
            createAmendment: null,
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <CreateAmendmentDialog onClose={mockOnClose} initialDemonstrationId="demo-123" />
      </MockedProvider>
    );

    const submitButton = screen.getByRole("button", { name: "Submit" });
    submitButton.click();

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith("Error creating amendment.");
      expect(consoleErrorSpy).toHaveBeenCalledWith("Unknown error");
      expect(mockOnClose).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });

  it("passes initialDemonstrationId to BaseCreateModificationDialog", () => {
    const mocks = [
      {
        request: {
          query: CREATE_AMENDMENT_MUTATION,
          variables: {
            input: {
              name: "Test Amendment",
              description: "Test Description",
              demonstrationId: "demo-123",
            },
          },
        },
        result: {
          data: {
            createAmendment: {
              id: "amendment-1",
              demonstration: {
                id: "demo-123",
                amendments: [{ id: "amendment-1" }],
              },
            },
          },
        },
      },
    ];
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <CreateAmendmentDialog onClose={mockOnClose} initialDemonstrationId="demo-456" />
      </MockedProvider>
    );

    // The mock implementation will receive the props
    expect(BaseCreateModificationDialog).toHaveBeenCalledWith(
      expect.objectContaining({
        initialDemonstrationId: "demo-456",
        modificationType: "Amendment",
        onClose: mockOnClose,
      }),
      undefined
    );
  });
});
