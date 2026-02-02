import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MockedProvider, MockedResponse } from "@apollo/client/testing";

import {
  EditDemonstrationTypeDialog,
  EDIT_DEMONSTRATION_TYPES_DIALOG_MUTATION,
  DemonstrationType,
} from "./EditDemonstrationTypeDialog";
import { DIALOG_CANCEL_BUTTON_NAME } from "../BaseDialog";
import { formatDateForServer, getTodayEst } from "util/formatDate";

const mockShowSuccess = vi.fn();
const mockShowError = vi.fn();
vi.mock("components/toast", () => ({
  useToast: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
  }),
}));

const mockCloseDialog = vi.fn();
vi.mock("../DialogContext", () => ({
  useDialog: () => ({
    closeDialog: mockCloseDialog,
  }),
}));

const SUBMIT_BUTTON_TEST_ID = "button-submit-edit-demonstration-type-dialog";
const MOCK_DEMONSTRATION_ID = "demo-123";
const MOCK_INITIAL_TYPE: DemonstrationType = {
  demonstrationTypeName: "Behavioral Health",
  status: "Active",
  effectiveDate: new Date("2024-01-01"),
  expirationDate: new Date("2024-12-31"),
};

describe("EditDemonstrationTypeDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("shows error message when mutation fails", async () => {
    const errorMock: MockedResponse = {
      request: {
        query: EDIT_DEMONSTRATION_TYPES_DIALOG_MUTATION,
        variables: {
          input: {
            demonstrationId: MOCK_DEMONSTRATION_ID,
            demonstrationTypes: [
              {
                demonstrationTypeName: MOCK_INITIAL_TYPE.demonstrationTypeName,
                demonstrationTypeDates: {
                  effectiveDate: "2024-02-01",
                  expirationDate: "2024-12-31",
                },
              },
            ],
          },
        },
      },
      result: {
        errors: [{ message: "Failed to edit type" }],
      },
    };

    const user = userEvent.setup();
    render(
      <MockedProvider mocks={[errorMock]} addTypename={false}>
        <EditDemonstrationTypeDialog
          demonstrationId={MOCK_DEMONSTRATION_ID}
          initialDemonstrationType={MOCK_INITIAL_TYPE}
        />
      </MockedProvider>
    );

    const effectiveDateInput = screen.getByLabelText(/Effective Date/i);
    await user.clear(effectiveDateInput);
    await user.type(effectiveDateInput, "2024-02-01");

    await waitFor(() => {
      const submitButton = screen.getByTestId(SUBMIT_BUTTON_TEST_ID);
      expect(submitButton).not.toBeDisabled();
    });

    await user.click(screen.getByTestId(SUBMIT_BUTTON_TEST_ID));

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith("Failed to edit demonstration type.");
      expect(mockCloseDialog).toHaveBeenCalledTimes(1);
    });
  });

  describe("basic rendering and interaction", () => {
    const setup = () => {
      render(
        <MockedProvider>
          <EditDemonstrationTypeDialog
            demonstrationId={MOCK_DEMONSTRATION_ID}
            initialDemonstrationType={MOCK_INITIAL_TYPE}
          />
        </MockedProvider>
      );
    };
    it("renders dialog with title and initial demonstration type data", () => {
      setup();

      expect(screen.getByText("Edit Type")).toBeInTheDocument();
      expect(screen.getByText("Type")).toBeInTheDocument();
      expect(screen.getByText("Behavioral Health")).toBeInTheDocument();
      expect(screen.getByText("Status")).toBeInTheDocument();
      expect(screen.getByText("Active")).toBeInTheDocument();
      expect(screen.getByLabelText(/Effective Date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Expiration Date/i)).toBeInTheDocument();
    });

    it("displays initial dates in date pickers", () => {
      setup();

      const effectiveDateInput = screen.getByLabelText(/Effective Date/i) as HTMLInputElement;
      const expirationDateInput = screen.getByLabelText(/Expiration Date/i) as HTMLInputElement;

      expect(effectiveDateInput.value).toBe("2024-01-01");
      expect(expirationDateInput.value).toBe("2024-12-31");
    });

    it("disables submit button when no changes are made", () => {
      setup();

      const submitButton = screen.getByTestId(SUBMIT_BUTTON_TEST_ID);
      expect(submitButton).toBeDisabled();
    });

    it("enables submit button when dates are changed", async () => {
      const user = userEvent.setup();
      setup();

      const effectiveDateInput = screen.getByLabelText(/Effective Date/i);
      await user.clear(effectiveDateInput);
      await user.type(effectiveDateInput, "2024-02-01");

      await waitFor(() => {
        const submitButton = screen.getByTestId(SUBMIT_BUTTON_TEST_ID);
        expect(submitButton).not.toBeDisabled();
      });
    });

    it("calls closeDialog when Cancel button is clicked", async () => {
      const user = userEvent.setup();
      setup();

      await user.click(screen.getByTestId(DIALOG_CANCEL_BUTTON_NAME));

      expect(mockCloseDialog).toHaveBeenCalledTimes(1);
    });

    it("displays validation error when expiration date is empty", async () => {
      const user = userEvent.setup();
      setup();

      const expirationDateInput = screen.getByLabelText(/Expiration Date/i);
      await user.clear(expirationDateInput);

      await waitFor(() => {
        expect(screen.getByText("Expiration Date is required.")).toBeInTheDocument();
      });
    });

    it("displays validation error when effective date is empty", async () => {
      const user = userEvent.setup();
      setup();

      const effectiveDateInput = screen.getByLabelText(/Effective Date/i);
      await user.clear(effectiveDateInput);

      await waitFor(() => {
        expect(screen.getByText("Effective Date is required.")).toBeInTheDocument();
      });
    });

    it("shows validation error when expiration date is before effective date", async () => {
      const user = userEvent.setup();
      setup();

      const effectiveDateInput = screen.getByLabelText(/Effective Date/i);
      const expirationDateInput = screen.getByLabelText(/Expiration Date/i);

      await user.clear(effectiveDateInput);
      await user.type(effectiveDateInput, "2024-12-31");
      await user.clear(expirationDateInput);
      await user.type(expirationDateInput, "2024-01-01");

      await waitFor(() => {
        expect(
          screen.getByText("Effective date must be on or before expiration date.")
        ).toBeInTheDocument();
      });
    });

    describe("status updates based on date changes", () => {
      it("updates status to Pending when today is before both dates", async () => {
        const user = userEvent.setup();
        setup();

        const effectiveDateInput = screen.getByLabelText(/Effective Date/i);
        const expirationDateInput = screen.getByLabelText(/Expiration Date/i);

        await user.clear(effectiveDateInput);
        await user.type(effectiveDateInput, "2090-01-01");
        await user.clear(expirationDateInput);
        await user.type(expirationDateInput, "2090-12-31");

        await waitFor(() => {
          expect(screen.getByText("Pending")).toBeInTheDocument();
        });
      });

      it("updates status to Expired when today is after both dates", async () => {
        const user = userEvent.setup();
        setup();

        const effectiveDateInput = screen.getByLabelText(/Effective Date/i);
        const expirationDateInput = screen.getByLabelText(/Expiration Date/i);

        await user.clear(effectiveDateInput);
        await user.type(effectiveDateInput, "1901-01-01");
        await user.clear(expirationDateInput);
        await user.type(expirationDateInput, "1901-12-31");

        await waitFor(() => {
          expect(screen.getByText("Expired")).toBeInTheDocument();
        });
      });

      it("updates status to Active when today is between both dates", async () => {
        const user = userEvent.setup();
        setup();

        const effectiveDateInput = screen.getByLabelText(/Effective Date/i);
        const expirationDateInput = screen.getByLabelText(/Expiration Date/i);

        await user.clear(effectiveDateInput);
        await user.type(effectiveDateInput, "1901-01-01");
        await user.clear(expirationDateInput);
        await user.type(expirationDateInput, "2090-12-31");

        await waitFor(() => {
          expect(screen.getByText("Active")).toBeInTheDocument();
        });
      });

      it("updates status to Active when today is on effective date", async () => {
        const user = userEvent.setup();
        setup();

        const effectiveDateInput = screen.getByLabelText(/Effective Date/i);
        const expirationDateInput = screen.getByLabelText(/Expiration Date/i);

        const today = formatDateForServer(getTodayEst());

        await user.clear(effectiveDateInput);
        await user.type(effectiveDateInput, today);
        await user.clear(expirationDateInput);
        await user.type(expirationDateInput, "2090-12-31");

        await waitFor(() => {
          expect(screen.getByText("Active")).toBeInTheDocument();
        });
      });

      it("updates status to Active when today is on expiration date", async () => {
        const user = userEvent.setup();
        setup();
        const effectiveDateInput = screen.getByLabelText(/Effective Date/i);
        const expirationDateInput = screen.getByLabelText(/Expiration Date/i);
        const today = formatDateForServer(getTodayEst());
        await user.clear(effectiveDateInput);
        await user.type(effectiveDateInput, "1901-01-01");
        await user.clear(expirationDateInput);
        await user.type(expirationDateInput, today);
        await waitFor(() => {
          expect(screen.getByText("Active")).toBeInTheDocument();
        });
      });
    });
  });

  describe("mutation behavior", () => {
    const createMock = (
      demonstrationId: string,
      effectiveDate: string,
      expirationDate: string
    ): MockedResponse => ({
      request: {
        query: EDIT_DEMONSTRATION_TYPES_DIALOG_MUTATION,
        variables: {
          input: {
            demonstrationId,
            demonstrationTypes: [
              {
                demonstrationTypeName: MOCK_INITIAL_TYPE.demonstrationTypeName,
                demonstrationTypeDates: {
                  effectiveDate,
                  expirationDate,
                },
              },
            ],
          },
        },
      },
      result: {
        data: {
          setDemonstrationTypes: {
            id: demonstrationId,
            demonstrationTypes: [
              {
                demonstrationTypeName: MOCK_INITIAL_TYPE.demonstrationTypeName,
              },
            ],
          },
        },
      },
    });

    const setup = (
      initialType: DemonstrationType = MOCK_INITIAL_TYPE,
      mocks: MockedResponse[] = []
    ) => {
      const user = userEvent.setup();
      const result = render(
        <MockedProvider mocks={mocks}>
          <EditDemonstrationTypeDialog
            demonstrationId={MOCK_DEMONSTRATION_ID}
            initialDemonstrationType={initialType}
          />
        </MockedProvider>
      );
      return { ...result, user };
    };

    it("successfully edits demonstration type and shows success message", async () => {
      const mock = createMock(MOCK_DEMONSTRATION_ID, "2024-02-01", "2024-12-31");
      const { user } = setup(MOCK_INITIAL_TYPE, [mock]);

      const effectiveDateInput = screen.getByLabelText(/Effective Date/i);
      await user.clear(effectiveDateInput);
      await user.type(effectiveDateInput, "2024-02-01");

      await waitFor(() => {
        const submitButton = screen.getByTestId(SUBMIT_BUTTON_TEST_ID);
        expect(submitButton).not.toBeDisabled();
      });

      await user.click(screen.getByTestId(SUBMIT_BUTTON_TEST_ID));

      await waitFor(() => {
        expect(mockShowSuccess).toHaveBeenCalledWith("Demonstration type edited successfully.");
        expect(mockCloseDialog).toHaveBeenCalledTimes(1);
      });
    });

    it("disables submit button while mutation is in progress", async () => {
      const mock = createMock(MOCK_DEMONSTRATION_ID, "2024-02-01", "2024-12-31");
      const { user } = setup(MOCK_INITIAL_TYPE, [mock]);

      const effectiveDateInput = screen.getByLabelText(/Effective Date/i);
      await user.clear(effectiveDateInput);
      await user.type(effectiveDateInput, "2024-02-01");

      await waitFor(() => {
        const submitButton = screen.getByTestId(SUBMIT_BUTTON_TEST_ID);
        expect(submitButton).not.toBeDisabled();
      });

      const submitButton = screen.getByTestId(SUBMIT_BUTTON_TEST_ID);
      fireEvent.click(submitButton);
      expect(submitButton).toBeDisabled();
    });

    it("calls mutation with correct variables", async () => {
      const mock = createMock(MOCK_DEMONSTRATION_ID, "2024-03-15", "2024-11-30");
      const { user } = setup(MOCK_INITIAL_TYPE, [mock]);

      const effectiveDateInput = screen.getByLabelText(/Effective Date/i);
      const expirationDateInput = screen.getByLabelText(/Expiration Date/i);

      await user.clear(effectiveDateInput);
      await user.type(effectiveDateInput, "2024-03-15");
      await user.clear(expirationDateInput);
      await user.type(expirationDateInput, "2024-11-30");

      await waitFor(() => {
        const submitButton = screen.getByTestId(SUBMIT_BUTTON_TEST_ID);
        expect(submitButton).not.toBeDisabled();
      });

      await user.click(screen.getByTestId(SUBMIT_BUTTON_TEST_ID));

      await waitFor(() => {
        expect(mockCloseDialog).toHaveBeenCalled();
      });

      // The mock will only match if the variables are correct
      expect(mockShowSuccess).toHaveBeenCalled();
    });
  });
});
