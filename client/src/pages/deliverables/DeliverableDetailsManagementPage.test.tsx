import React from "react";
import { Route, Routes } from "react-router-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  DeliverableDetailsManagementPage,
  DELIVERABLE_DETAILS_QUERY,
  START_DELIVERABLE_REVIEW_MUTATION,
  type DeliverableDetailsManagementDeliverable,
} from "./DeliverableDetailsManagementPage";
import { MOCK_DELIVERABLE_1 } from "mock-data/deliverableMocks";
import { TestProvider } from "test-utils/TestProvider";
import { COMMENT_BOX_NAME } from "./sections/comment_box";
import {
  BACK_TO_DELIVERABLES_BUTTON_NAME,
  DELIVERABLE_INFO_FIELDS_NAME,
} from "./sections/DeliverableInfoFields";
import { FILE_AND_HISTORY_TABS_NAME } from "./sections/FileAndHistoryTabs";
import { REQUEST_EXTENSION_BUTTON_NAME } from "./sections/DeliverableButtons";
import { DialogProvider } from "components/dialog/DialogContext";
import {
  EDIT_DELIVERABLE_DIALOG_TITLE,
  EDIT_DELIVERABLE_REASON_FIELD_NAME,
  EDIT_DELIVERABLE_SAVE_BUTTON_NAME,
  UPDATE_DELIVERABLE_MUTATION,
} from "components/dialog/deliverable/EditDeliverableDialog";
import {
  DELIVERABLE_REVIEW_NOTICE_NAME,
  START_REVIEW_BUTTON_NAME,
} from "./sections/PendingReviewNotice";
import { CurrentUser } from "components/user/UserContext";
import { developmentMockUser } from "mock-data/userMocks";
import { personMocks } from "mock-data/personMocks";
import { SINGLE_DELIVERABLE_DUE_DATE_NAME } from "components/dialog/deliverable/fields/schedule-type/SingleDeliverableScheduleType";

const buildSubmittedDeliverableMock = (overrides?: { submitterName?: string }) => ({
  ...MOCK_DELIVERABLE_1,
  status: "Submitted" as const,
  deliverableActions: [
    ...MOCK_DELIVERABLE_1.deliverableActions,
    {
      id: "action-submit",
      actionType: "Submitted Deliverable" as const,
      actionTimestamp: new Date("2026-04-01T10:00:00Z"),
      userFullName: overrides?.submitterName ?? "Jane State",
      details: "",
    },
  ],
});

const buildCurrentUser = (
  personType: CurrentUser["person"]["personType"]
): CurrentUser => ({
  ...developmentMockUser,
  person: { ...developmentMockUser.person, personType },
});

const renderAtRoute = (
  deliverableId: string,
  personType: CurrentUser["person"]["personType"] = "demos-cms-user"
) =>
  render(
    <TestProvider
      currentUser={buildCurrentUser(personType)}
      routerEntries={[`/deliverables/${deliverableId}`]}
    >
      <DialogProvider>
        <Routes>
          <Route
            path="/deliverables/:deliverableId"
            element={<DeliverableDetailsManagementPage />}
          />
          <Route path="/demonstrations/:id" element={<div>Demonstration deliverables list</div>} />
          <Route path="/" element={<div>State home deliverables list</div>} />
        </Routes>
      </DialogProvider>
    </TestProvider>
  );

const renderWithDeliverable = (
  deliverable: DeliverableDetailsManagementDeliverable,
  personType: CurrentUser["person"]["personType"] = "demos-cms-user",
  extraMocks: import("@apollo/client/testing").MockedResponse[] = []
) =>
  render(
    <TestProvider
      currentUser={buildCurrentUser(personType)}
      mocks={[
        {
          request: { query: DELIVERABLE_DETAILS_QUERY, variables: { id: deliverable.id } },
          result: { data: { deliverable } },
        },
        ...extraMocks,
      ]}
      routerEntries={[`/deliverables/${deliverable.id}`]}
    >
      <DialogProvider>
        <Routes>
          <Route
            path="/deliverables/:deliverableId"
            element={<DeliverableDetailsManagementPage />}
          />
          <Route path="/demonstrations/:id" element={<div>Demonstration deliverables list</div>} />
          <Route path="/" element={<div>State home deliverables list</div>} />
        </Routes>
      </DialogProvider>
    </TestProvider>
  );

describe("DeliverableDetailsManagementPage", () => {
  it("renders the deliverable name heading", async () => {
    renderAtRoute("1");

    await waitFor(() => expect(screen.getByText(MOCK_DELIVERABLE_1.name)).toBeInTheDocument());
  });

  it("renders DeliverableInfoFields", async () => {
    renderAtRoute("1");

    await waitFor(() =>
      expect(screen.getByTestId(DELIVERABLE_INFO_FIELDS_NAME)).toBeInTheDocument()
    );
  });

  // Commented out in the page.
  // it("renders DeliverableButtons", async () => {
  //   renderAtRoute("1");

  //   await waitFor(() => expect(screen.getByTestId(DELIVERABLE_BUTTONS_NAME)).toBeInTheDocument());
  // });

  it("renders FileAndHistoryTabs", async () => {
    renderAtRoute("1");

    await waitFor(() => expect(screen.getByTestId(FILE_AND_HISTORY_TABS_NAME)).toBeInTheDocument());
  });

  it("renders CommentBox", async () => {
    renderAtRoute("1");

    await waitFor(() => expect(screen.getByTestId(COMMENT_BOX_NAME)).toBeInTheDocument());
  });

  it.each(["demos-cms-user", "demos-admin"] as const)(
    "navigates %s users back to the demonstration deliverables list",
    async (personType) => {
      const user = userEvent.setup();
      renderAtRoute("1", personType);

      await user.click(await screen.findByTestId(BACK_TO_DELIVERABLES_BUTTON_NAME));

      expect(screen.getByText("Demonstration deliverables list")).toBeInTheDocument();
    }
  );

  it("navigates state users back to their home deliverables list", async () => {
    const user = userEvent.setup();
    renderAtRoute("1", "demos-state-user");

    await user.click(await screen.findByTestId(BACK_TO_DELIVERABLES_BUTTON_NAME));

    expect(screen.getByText("State home deliverables list")).toBeInTheDocument();
  });

  it("uses the supplied onBack handler when provided", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(
      <TestProvider
        currentUser={buildCurrentUser("demos-admin")}
        mocks={[
          {
            request: { query: DELIVERABLE_DETAILS_QUERY, variables: { id: MOCK_DELIVERABLE_1.id } },
            result: { data: { deliverable: MOCK_DELIVERABLE_1 } },
          },
        ]}
        routerEntries={[`/deliverables/${MOCK_DELIVERABLE_1.id}`]}
      >
        <DialogProvider>
          <DeliverableDetailsManagementPage
            deliverableId={MOCK_DELIVERABLE_1.id}
            onBack={onBack}
          />
        </DialogProvider>
      </TestProvider>
    );

    await user.click(await screen.findByTestId(BACK_TO_DELIVERABLES_BUTTON_NAME));

    expect(onBack).toHaveBeenCalledOnce();
  });

  it("toggles more details", async () => {
    const user = userEvent.setup();
    renderAtRoute("1");

    expect(await screen.findByText("More Details")).toBeInTheDocument();
    expect(screen.queryByTestId("deliverable-CMS Owner")).not.toBeInTheDocument();

    await user.click(screen.getByText("More Details"));

    expect(screen.getByText("Less Details")).toBeInTheDocument();
    expect(screen.getByTestId("deliverable-CMS Owner")).toHaveTextContent("Mock User");
  });

  it("does not render the pending review notice when status is not Submitted", async () => {
    renderAtRoute("1");

    await waitFor(() => expect(screen.getByTestId(COMMENT_BOX_NAME)).toBeInTheDocument());
    expect(screen.queryByTestId(DELIVERABLE_REVIEW_NOTICE_NAME)).not.toBeInTheDocument();
  });

  it("renders the pending review notice with the submitter's name for CMS users when status is Submitted", async () => {
    const deliverable = buildSubmittedDeliverableMock({ submitterName: "Alex Patel" });
    renderWithDeliverable(deliverable, "demos-cms-user");

    expect(await screen.findByTestId(DELIVERABLE_REVIEW_NOTICE_NAME)).toBeInTheDocument();
    expect(
      screen.getByText("Alex Patel has submitted deliverable(s) for review")
    ).toBeInTheDocument();
  });

  it("renders the pending review notice for admin users", async () => {
    const deliverable = buildSubmittedDeliverableMock();
    renderWithDeliverable(deliverable, "demos-admin");

    expect(await screen.findByTestId(DELIVERABLE_REVIEW_NOTICE_NAME)).toBeInTheDocument();
  });

  it("does not render the pending review notice for state users", async () => {
    const deliverable = buildSubmittedDeliverableMock();
    renderWithDeliverable(deliverable, "demos-state-user");

    await waitFor(() => expect(screen.getByTestId(COMMENT_BOX_NAME)).toBeInTheDocument());
    expect(screen.queryByTestId(DELIVERABLE_REVIEW_NOTICE_NAME)).not.toBeInTheDocument();
  });

  it("triggers the start review mutation and hides the banner once status flips to Under CMS Review", async () => {
    const user = userEvent.setup();
    const deliverable = buildSubmittedDeliverableMock();
    const reviewedDeliverable = { ...deliverable, status: "Under CMS Review" as const };

    renderWithDeliverable(deliverable, "demos-cms-user", [
      {
        request: {
          query: START_DELIVERABLE_REVIEW_MUTATION,
          variables: { id: deliverable.id },
        },
        result: { data: { startDeliverableReview: { id: deliverable.id, status: "Under CMS Review" } } },
      },
      {
        request: { query: DELIVERABLE_DETAILS_QUERY, variables: { id: deliverable.id } },
        result: { data: { deliverable: reviewedDeliverable } },
        maxUsageCount: Number.POSITIVE_INFINITY,
      },
    ]);

    await user.click(await screen.findByTestId(START_REVIEW_BUTTON_NAME));

    await waitFor(() =>
      expect(screen.queryByTestId(DELIVERABLE_REVIEW_NOTICE_NAME)).not.toBeInTheDocument()
    );
  });

  it("disables the header Edit and Delete buttons when the deliverable is finalized", async () => {
    const deliverable = { ...MOCK_DELIVERABLE_1, status: "Approved" as const };
    renderWithDeliverable(deliverable);

    expect(await screen.findByTestId("edit-deliverable-button")).toBeDisabled();
    expect(screen.getByTestId("delete-deliverable-button")).toBeDisabled();
  });

  it("keeps the header Edit and Delete buttons enabled for an editable deliverable", async () => {
    const deliverable = { ...MOCK_DELIVERABLE_1, status: "Upcoming" as const };
    renderWithDeliverable(deliverable);

    expect(await screen.findByTestId("edit-deliverable-button")).not.toBeDisabled();
    expect(screen.getByTestId("delete-deliverable-button")).not.toBeDisabled();
  });

  it("opens the edit deliverable modal from the header Edit button", async () => {
    const user = userEvent.setup();
    const deliverable = { ...MOCK_DELIVERABLE_1, status: "Upcoming" as const };
    renderWithDeliverable(deliverable, "demos-admin", personMocks);

    await user.click(await screen.findByTestId("edit-deliverable-button"));

    expect(screen.getByText(EDIT_DELIVERABLE_DIALOG_TITLE)).toBeInTheDocument();
  });

  it("refreshes history after saving a due date edit from the route", async () => {
    const user = userEvent.setup();
    const updatedDeliverable = {
      ...MOCK_DELIVERABLE_1,
      dueDate: new Date("2026-07-20"),
      deliverableActions: [
        ...MOCK_DELIVERABLE_1.deliverableActions,
        {
          id: "action-due-date-edit",
          actionType: "Manually Changed Due Date" as const,
          actionTimestamp: new Date("2026-06-23T10:00:00Z"),
          userFullName: "Dustin Horning (CMS User)",
          details:
            "Old Due Date: 08/15/2024\nNew Due Date: 07/20/2026\nReason Details: needed extra day",
        },
      ],
    };

    renderWithDeliverable(MOCK_DELIVERABLE_1, "demos-admin", [
      ...personMocks,
      {
        request: {
          query: UPDATE_DELIVERABLE_MUTATION,
          variables: {
            id: MOCK_DELIVERABLE_1.id,
            input: {
              name: MOCK_DELIVERABLE_1.name,
              cmsOwnerUserId: MOCK_DELIVERABLE_1.cmsOwner.id,
              demonstrationTypes: [],
              dueDate: {
                newDueDate: "2026-07-20",
                dateChangeNote: "needed extra day",
              },
            },
          },
        },
        result: {
          data: {
            updateDeliverable: {
              id: MOCK_DELIVERABLE_1.id,
              name: MOCK_DELIVERABLE_1.name,
              dueDate: new Date("2026-07-20"),
              cmsOwner: MOCK_DELIVERABLE_1.cmsOwner,
              demonstrationTypes: [],
            },
          },
        },
      },
      {
        request: {
          query: DELIVERABLE_DETAILS_QUERY,
          variables: { id: MOCK_DELIVERABLE_1.id },
        },
        result: { data: { deliverable: updatedDeliverable } },
      },
    ]);

    await user.click(await screen.findByTestId("edit-deliverable-button"));
    fireEvent.change(screen.getByTestId(SINGLE_DELIVERABLE_DUE_DATE_NAME), {
      target: { value: "2026-07-20" },
    });
    await user.type(screen.getByTestId(EDIT_DELIVERABLE_REASON_FIELD_NAME), "needed extra day");
    await user.click(screen.getByTestId(EDIT_DELIVERABLE_SAVE_BUTTON_NAME));

    await waitFor(() =>
      expect(screen.queryByText(EDIT_DELIVERABLE_DIALOG_TITLE)).not.toBeInTheDocument()
    );
    await user.click(screen.getByTestId("button-history"));

    expect(await screen.findByText("Manually Changed Due Date")).toBeInTheDocument();
    expect(screen.getByText(/Reason Details: needed extra day/)).toBeInTheDocument();
  });

  it("shows only the Request Extension button for state users", async () => {
    renderWithDeliverable(MOCK_DELIVERABLE_1, "demos-state-user");

    expect(await screen.findByTestId(REQUEST_EXTENSION_BUTTON_NAME)).toBeInTheDocument();
    expect(screen.queryByTestId("edit-deliverable-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("delete-deliverable-button")).not.toBeInTheDocument();
  });

  it("shows Request Extension alongside Edit and Delete for admin users", async () => {
    renderWithDeliverable(MOCK_DELIVERABLE_1, "demos-admin");

    expect(await screen.findByTestId(REQUEST_EXTENSION_BUTTON_NAME)).toBeInTheDocument();
    expect(screen.getByTestId("edit-deliverable-button")).toBeInTheDocument();
    expect(screen.getByTestId("delete-deliverable-button")).toBeInTheDocument();
  });

  it("shows not found state", async () => {
    const notFoundMock = {
      request: { query: DELIVERABLE_DETAILS_QUERY, variables: { id: "1" } },
      result: { data: { deliverable: null } },
    };

    render(
      <TestProvider mocks={[notFoundMock]} routerEntries={["/deliverables/1"]}>
        <DialogProvider>
          <Routes>
            <Route
              path="/deliverables/:deliverableId"
              element={<DeliverableDetailsManagementPage />}
            />
          </Routes>
        </DialogProvider>
      </TestProvider>
    );

    await waitFor(() => expect(screen.getByText(/deliverable not found/i)).toBeInTheDocument());
  });

  it("shows error state", async () => {
    const errorMock = {
      request: { query: DELIVERABLE_DETAILS_QUERY, variables: { id: "1" } },
      error: new Error("Something went wrong"),
    };

    render(
      <TestProvider mocks={[errorMock]} routerEntries={["/deliverables/1"]}>
        <DialogProvider>
          <Routes>
            <Route
              path="/deliverables/:deliverableId"
              element={<DeliverableDetailsManagementPage />}
            />
          </Routes>
        </DialogProvider>
      </TestProvider>
    );

    await waitFor(() => expect(screen.getByText(/error loading deliverable/i)).toBeInTheDocument());
  });
});
