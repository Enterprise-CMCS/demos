import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeliverableStatus } from "demos-server";

import { DeliverableButtons, REQUEST_RENEWAL_BUTTON_NAME } from "./DeliverableButtons";
import { MOCK_DELIVERABLE_1 } from "mock-data/deliverableMocks";
import { DeliverableDetailsManagementDeliverable } from "../DeliverableDetailsManagementPage";
import { TestProvider } from "test-utils/TestProvider";
import { DialogProvider } from "components/dialog/DialogContext";
import { CurrentUser } from "components/user/UserContext";
import { developmentMockUser } from "mock-data/userMocks";

const mockShowRequestRenewalDeliverableDialog = vi.fn();
vi.mock("components/dialog/DialogContext", async () => {
  const actual = await vi.importActual<typeof import("components/dialog/DialogContext")>(
    "components/dialog/DialogContext"
  );
  return {
    ...actual,
    useDialog: () => ({
      ...actual.useDialog,
      showRequestRenewalDeliverableDialog: mockShowRequestRenewalDeliverableDialog,
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
        <DeliverableButtons deliverable={deliverable} />
      </DialogProvider>
    </TestProvider>
  );

describe("DeliverableButtons", () => {
  beforeEach(() => {
    mockShowRequestRenewalDeliverableDialog.mockClear();
  });

  it("renders the Request Renewal button for state users", () => {
    renderButtons(buildDeliverable(), "demos-state-user");
    expect(screen.getByTestId(REQUEST_RENEWAL_BUTTON_NAME)).toHaveTextContent("Request Renewal");
  });

  it("renders the Request Renewal button for admin users", () => {
    renderButtons(buildDeliverable(), "demos-admin");
    expect(screen.getByTestId(REQUEST_RENEWAL_BUTTON_NAME)).toHaveTextContent("Request Renewal");
  });

  it("does not render the Request Renewal button for CMS users", () => {
    renderButtons(buildDeliverable(), "demos-cms-user");
    expect(screen.queryByTestId(REQUEST_RENEWAL_BUTTON_NAME)).not.toBeInTheDocument();
  });

  it("renders the Request Renewal button enabled for Upcoming deliverables", () => {
    renderButtons(buildDeliverable({ status: "Upcoming" }));
    const button = screen.getByTestId(REQUEST_RENEWAL_BUTTON_NAME);
    expect(button).toHaveTextContent("Request Renewal");
    expect(button).toBeEnabled();
  });

  it("renders the Request Renewal button enabled for Past Due deliverables", () => {
    renderButtons(buildDeliverable({ status: "Past Due" }));
    expect(screen.getByTestId(REQUEST_RENEWAL_BUTTON_NAME)).toBeEnabled();
  });

  it.each<DeliverableStatus>([
    "Submitted",
    "Under CMS Review",
    "Accepted",
    "Approved",
    "Received and Filed",
  ])("disables the Request Renewal button when status is %s", (status) => {
    renderButtons(buildDeliverable({ status }));
    const button = screen.getByTestId(REQUEST_RENEWAL_BUTTON_NAME);
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it("disables the Request Renewal button when a renewal is already Requested", () => {
    renderButtons(
      buildDeliverable({
        status: "Upcoming",
        renewalRequests: [
          {
            id: "ext-1",
            status: "Requested",
            reasonCode: "Other",
            reasonDetails: "details",
            initialDueDateAtRequest: new Date("2026-03-01"),
            originalDateRequested: new Date("2026-04-15"),
            createdAt: new Date("2026-04-01"),
          },
        ],
      })
    );
    expect(screen.getByTestId(REQUEST_RENEWAL_BUTTON_NAME)).toBeDisabled();
  });

  it("opens the Request Renewal dialog when clicked", async () => {
    const user = userEvent.setup();
    renderButtons(buildDeliverable({ status: "Upcoming" }));

    await user.click(screen.getByTestId(REQUEST_RENEWAL_BUTTON_NAME));

    expect(mockShowRequestRenewalDeliverableDialog).toHaveBeenCalledWith({
      id: MOCK_DELIVERABLE_1.id,
      dueDate: MOCK_DELIVERABLE_1.dueDate,
    });
  });

  it("does not open the Request Renewal dialog when the button is disabled", async () => {
    const user = userEvent.setup();
    renderButtons(buildDeliverable({ status: "Approved" }));

    await user.click(screen.getByTestId(REQUEST_RENEWAL_BUTTON_NAME));

    expect(mockShowRequestRenewalDeliverableDialog).not.toHaveBeenCalled();
  });
});
