import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MockedProvider, MockedResponse } from "@apollo/client/testing";

import {
  RemoveDemonstrationTypesDialog,
  REMOVE_DEMONSTRATION_TYPES_DIALOG_MUTATION,
} from "./RemoveDemonstrationTypesDialog";
import { Tag as DemonstrationTypeName } from "demos-server";
import { DIALOG_CANCEL_BUTTON_NAME } from "./BaseDialog";

const mockShowSuccess = vi.fn();
const mockShowError = vi.fn();
vi.mock("components/toast", () => ({
  useToast: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
  }),
}));

const mockCloseDialog = vi.fn();
vi.mock("./DialogContext", () => ({
  useDialog: () => ({
    closeDialog: mockCloseDialog,
  }),
}));

const CONFIRM_REMOVE_BUTTON_TEST_ID = "button-confirm-remove-types";
const MOCK_DEMONSTRATION_ID = "demo-123";

describe("RemoveDemonstrationTypesDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const createSuccessMock = (demonstrationTypeNames: DemonstrationTypeName[]): MockedResponse => ({
    request: {
      query: REMOVE_DEMONSTRATION_TYPES_DIALOG_MUTATION,
      variables: {
        input: {
          demonstrationId: MOCK_DEMONSTRATION_ID,
          demonstrationTypes: demonstrationTypeNames.map((demonstrationTypeName) => ({
            demonstrationTypeName,
            demonstrationTypeDates: null,
          })),
        },
      },
    },
    result: {
      data: {
        setDemonstrationTypes: {
          id: MOCK_DEMONSTRATION_ID,
          demonstrationTypes: [],
        },
      },
    },
  });

  describe("successful removal", () => {
    const setup = (
      demonstrationTypeNames: DemonstrationTypeName[] = ["Behavioral Health"],
      mocks: MockedResponse[] = []
    ) => {
      return render(
        <MockedProvider mocks={mocks}>
          <RemoveDemonstrationTypesDialog
            demonstrationId={MOCK_DEMONSTRATION_ID}
            demonstrationTypeNames={demonstrationTypeNames}
          />
        </MockedProvider>
      );
    };

    it("renders with single demonstration type", () => {
      const typeNames: DemonstrationTypeName[] = ["Behavioral Health"];
      setup(typeNames, [createSuccessMock(typeNames)]);

      expect(screen.getByText("Remove Type(s)")).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to remove this Type/)).toBeInTheDocument();
      expect(screen.getByText(/This action cannot be undone/)).toBeInTheDocument();
      expect(screen.getByTestId(CONFIRM_REMOVE_BUTTON_TEST_ID)).toBeInTheDocument();
      expect(screen.getByTestId(DIALOG_CANCEL_BUTTON_NAME)).toBeInTheDocument();
    });

    it("renders with multiple demonstration types", () => {
      const typeNames: DemonstrationTypeName[] = ["Behavioral Health", "Dental", "CHIP"];
      setup(typeNames, [createSuccessMock(typeNames)]);

      expect(screen.getByText("Remove Type(s)")).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to remove 3 Types/)).toBeInTheDocument();
    });

    it("displays error icon and warning message", () => {
      const typeNames: DemonstrationTypeName[] = ["Behavioral Health"];
      setup(typeNames, [createSuccessMock(typeNames)]);

      expect(screen.getByText(/This action cannot be undone/)).toBeInTheDocument();
      const errorIcon = screen.getByRole("img", { hidden: true });
      expect(errorIcon).toBeInTheDocument();
    });

    it("calls closeDialog when Cancel button is clicked", async () => {
      const user = userEvent.setup();
      const typeNames: DemonstrationTypeName[] = ["Behavioral Health"];
      setup(typeNames, [createSuccessMock(typeNames)]);

      await user.click(screen.getByTestId(DIALOG_CANCEL_BUTTON_NAME));

      expect(mockCloseDialog).toHaveBeenCalledTimes(1);
    });

    it("removes demonstration types and shows success message", async () => {
      const user = userEvent.setup();
      const typeNames: DemonstrationTypeName[] = ["Behavioral Health", "Dental"];
      setup(typeNames, [createSuccessMock(typeNames)]);

      await user.click(screen.getByTestId(CONFIRM_REMOVE_BUTTON_TEST_ID));

      await waitFor(() => {
        expect(mockShowSuccess).toHaveBeenCalledWith("Demonstration type(s) removed successfully.");
        expect(mockCloseDialog).toHaveBeenCalledTimes(1);
      });
    });

    it("disables Remove button while mutation is in progress", async () => {
      const typeNames: DemonstrationTypeName[] = ["Behavioral Health"];
      setup(typeNames, [createSuccessMock(typeNames)]);

      const removeButton = screen.getByTestId(CONFIRM_REMOVE_BUTTON_TEST_ID);

      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(screen.getByText("Removing...")).toBeInTheDocument();
      });
    });

    it("calls mutation with correct variables", async () => {
      const user = userEvent.setup();
      const typeNames: DemonstrationTypeName[] = ["Behavioral Health", "CHIP", "Dental"];
      setup(typeNames, [createSuccessMock(typeNames)]);

      await user.click(screen.getByTestId(CONFIRM_REMOVE_BUTTON_TEST_ID));

      await waitFor(() => {
        expect(mockCloseDialog).toHaveBeenCalled();
      });
      expect(mockShowSuccess).toHaveBeenCalled();
    });
  });

  it("shows error message when mutation fails", async () => {
    const errorMock: MockedResponse = {
      request: {
        query: REMOVE_DEMONSTRATION_TYPES_DIALOG_MUTATION,
        variables: {
          input: {
            demonstrationId: MOCK_DEMONSTRATION_ID,
            demonstrationTypes: [
              {
                demonstrationTypeName: "Behavioral Health",
                demonstrationTypeDates: null,
              },
            ],
          },
        },
      },
      result: {
        errors: [new Error("Error removing demonstration types")],
      },
    };
    const user = userEvent.setup();
    render(
      <MockedProvider mocks={[errorMock]}>
        <RemoveDemonstrationTypesDialog
          demonstrationId={MOCK_DEMONSTRATION_ID}
          demonstrationTypeNames={["Behavioral Health"]}
        />
      </MockedProvider>
    );
    await user.click(screen.getByTestId(CONFIRM_REMOVE_BUTTON_TEST_ID));
    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith("Failed to remove demonstration types.");
      expect(mockCloseDialog).toHaveBeenCalledTimes(1);
    });
  });
});
