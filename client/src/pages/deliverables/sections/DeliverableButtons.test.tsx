import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeliverableStatus } from "demos-server";

import {
  DeliverableButtons,
  REQUEST_EXTENSION_BUTTON_NAME,
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

const renderButtons = (
  deliverable: DeliverableDetailsManagementDeliverable,
  personType: CurrentUser["person"]["personType"] = "demos-state-user"
) =>
  render(
    <TestProvider currentUser={buildCurrentUser(personType)}>
      <DialogProvider>
        <DeliverableButtons
          deliverable={deliverable}
        />
      </DialogProvider>
    </TestProvider>
  );

describe("DeliverableButtons", () => {
  beforeEach(() => {
    mockShowRequestExtensionDeliverableDialog.mockClear();
  });

  it("renders the Request Extension button for state users", () => {
    renderButtons(buildDeliverable(), "demos-state-user");
    expect(screen.getByTestId(REQUEST_EXTENSION_BUTTON_NAME)).toHaveTextContent(
      "Request Extension"
    );
  });

  it("renders the Request Extension button for admin users", () => {
    renderButtons(buildDeliverable(), "demos-admin");
    expect(screen.getByTestId(REQUEST_EXTENSION_BUTTON_NAME)).toHaveTextContent(
      "Request Extension"
    );
  });

  it("does not render the Request Extension button for CMS users", () => {
    renderButtons(buildDeliverable(), "demos-cms-user");
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

  it("disables the Request Extension button when an extension is already Requested", () => {
    renderButtons(
      buildDeliverable({
        status: "Upcoming",
        deliverableExtensions: [
          { id: "ext-1", status: "Requested", createdAt: new Date("2026-04-01") },
        ],
      })
    );
    expect(screen.getByTestId(REQUEST_EXTENSION_BUTTON_NAME)).toBeDisabled();
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
});
