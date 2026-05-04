import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeliverableStatus } from "demos-server";

import {
  canRequestResubmission,
  DeliverableButtons,
  REQUEST_EXTENSION_BUTTON_NAME,
  REQUEST_RESUBMISSION_BUTTON_NAME,
} from "./DeliverableButtons";
import { MOCK_DELIVERABLE_1 } from "mock-data/deliverableMocks";
import { DeliverableDetailsManagementDeliverable } from "../DeliverableDetailsManagementPage";
import { TestProvider } from "test-utils/TestProvider";
import { DialogProvider } from "components/dialog/DialogContext";
import { CurrentUser } from "components/user/UserContext";
import { developmentMockUser } from "mock-data/userMocks";

const mockShowRequestExtensionDeliverableDialog = vi.fn();
vi.mock("components/dialog/DialogContext", async () => {
  const actual = await vi.importActual<typeof import("components/dialog/DialogContext")>(
    "components/dialog/DialogContext"
  );
  return {
    ...actual,
    useDialog: () => ({
      ...actual.useDialog,
      showRequestExtensionDeliverableDialog: mockShowRequestExtensionDeliverableDialog,
      closeDialog: vi.fn(),
    }),
  };
});

const buildDeliverable = (
  overrides?: Partial<DeliverableDetailsManagementDeliverable>
): DeliverableDetailsManagementDeliverable => ({
  ...MOCK_DELIVERABLE_1,
  ...overrides,
});

const buildCurrentUser = (personType: CurrentUser["person"]["personType"]): CurrentUser => ({
  ...developmentMockUser,
  person: {
    ...developmentMockUser.person,
    personType,
  },
});

const mockOnRequestResubmission = vi.fn();

const renderButtons = (
  deliverable: DeliverableDetailsManagementDeliverable,
  personType: CurrentUser["person"]["personType"] = "demos-state-user"
) =>
  render(
    <TestProvider currentUser={buildCurrentUser(personType)}>
      <DialogProvider>
        <DeliverableButtons
          deliverable={deliverable}
          onRequestResubmission={mockOnRequestResubmission}
        />
      </DialogProvider>
    </TestProvider>
  );

describe("DeliverableButtons", () => {
  beforeEach(() => {
    mockShowRequestExtensionDeliverableDialog.mockClear();
    mockOnRequestResubmission.mockClear();
  });

  it("renders the Request Extension button for state users", () => {
    renderButtons(buildDeliverable(), "demos-state-user");
    expect(screen.getByTestId(REQUEST_EXTENSION_BUTTON_NAME)).toHaveTextContent(
      "Request Extension"
    );
    expect(screen.queryByTestId(REQUEST_RESUBMISSION_BUTTON_NAME)).not.toBeInTheDocument();
  });

  it("renders the Request Resubmission button for CMS users", () => {
    renderButtons(buildDeliverable({ status: "Submitted" }), "demos-cms-user");
    expect(screen.getByTestId(REQUEST_RESUBMISSION_BUTTON_NAME)).toHaveTextContent(
      "Request Resubmission"
    );
    expect(screen.queryByTestId(REQUEST_EXTENSION_BUTTON_NAME)).not.toBeInTheDocument();
  });

  it("renders the Request Extension button enabled for Upcoming deliverables", () => {
    renderButtons(buildDeliverable({ status: "Upcoming" }));
    const button = screen.getByTestId(REQUEST_EXTENSION_BUTTON_NAME);
    expect(button).toHaveTextContent("Request Extension");
    expect(button).toBeEnabled();
  });

  it("renders the Request Extension button enabled for Past Due deliverables", () => {
    renderButtons(buildDeliverable({ status: "Past Due" }));
    expect(screen.getByTestId(REQUEST_EXTENSION_BUTTON_NAME)).toBeEnabled();
  });

  it.each<DeliverableStatus>([
    "Submitted",
    "Under CMS Review",
    "Accepted",
    "Approved",
    "Received and Filed",
  ])("disables the Request Extension button when status is %s", (status) => {
    renderButtons(buildDeliverable({ status }));
    const button = screen.getByTestId(REQUEST_EXTENSION_BUTTON_NAME);
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it.each<DeliverableStatus>(["Submitted", "Under CMS Review"])(
    "renders the Request Resubmission button enabled when status is %s",
    (status) => {
      renderButtons(buildDeliverable({ status }), "demos-cms-user");
      expect(screen.getByTestId(REQUEST_RESUBMISSION_BUTTON_NAME)).toBeEnabled();
    }
  );

  it.each<DeliverableStatus>([
    "Upcoming",
    "Past Due",
    "Accepted",
    "Approved",
    "Received and Filed",
  ])("disables the Request Resubmission button when status is %s", (status) => {
    renderButtons(buildDeliverable({ status }), "demos-cms-user");
    expect(screen.getByTestId(REQUEST_RESUBMISSION_BUTTON_NAME)).toBeDisabled();
  });

  it("opens the Request Extension dialog when clicked", async () => {
    const user = userEvent.setup();
    renderButtons(buildDeliverable({ status: "Upcoming" }));

    await user.click(screen.getByTestId(REQUEST_EXTENSION_BUTTON_NAME));

    expect(mockShowRequestExtensionDeliverableDialog).toHaveBeenCalledWith({
      id: MOCK_DELIVERABLE_1.id,
      dueDate: MOCK_DELIVERABLE_1.dueDate,
      demonstration: { expirationDate: MOCK_DELIVERABLE_1.demonstration.expirationDate },
    });
  });

  it("does not open the Request Extension dialog when the button is disabled", async () => {
    const user = userEvent.setup();
    renderButtons(buildDeliverable({ status: "Approved" }));

    await user.click(screen.getByTestId(REQUEST_EXTENSION_BUTTON_NAME));

    expect(mockShowRequestExtensionDeliverableDialog).not.toHaveBeenCalled();
  });

  it("calls onRequestResubmission when the Request Resubmission button is clicked", async () => {
    const user = userEvent.setup();
    const deliverable = buildDeliverable({ status: "Submitted" });
    renderButtons(deliverable, "demos-cms-user");

    await user.click(screen.getByTestId(REQUEST_RESUBMISSION_BUTTON_NAME));

    expect(mockOnRequestResubmission).toHaveBeenCalledWith(deliverable);
  });

  it("does not call onRequestResubmission when the button is disabled", async () => {
    const user = userEvent.setup();
    renderButtons(buildDeliverable({ status: "Approved" }), "demos-cms-user");

    await user.click(screen.getByTestId(REQUEST_RESUBMISSION_BUTTON_NAME));

    expect(mockOnRequestResubmission).not.toHaveBeenCalled();
  });
});

describe("canRequestResubmission", () => {
  it.each<DeliverableStatus>(["Submitted", "Under CMS Review"])("returns true for %s", (status) => {
    expect(canRequestResubmission(status)).toBe(true);
  });

  it.each<DeliverableStatus>([
    "Upcoming",
    "Past Due",
    "Accepted",
    "Approved",
    "Received and Filed",
  ])("returns false for %s", (status) => {
    expect(canRequestResubmission(status)).toBe(false);
  });
});
