import React from "react";
import { Route, Routes } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  DeliverableDetailsManagementPage,
  DELIVERABLE_DETAILS_QUERY,
  START_DELIVERABLE_REVIEW_MUTATION,
} from "./DeliverableDetailsManagementPage";
import { MOCK_DELIVERABLE_1 } from "mock-data/deliverableMocks";
import { TestProvider } from "test-utils/TestProvider";
import { COMMENT_BOX_NAME } from "./sections/comment_box";
import { DELIVERABLE_INFO_FIELDS_NAME,   BACK_TO_DELIVERABLES_BUTTON_NAME} from "./sections/DeliverableInfoFields";
import { FILE_AND_HISTORY_TABS_NAME } from "./sections/FileAndHistoryTabs";
// import { DELIVERABLE_BUTTONS_NAME } from "./sections/DeliverableButtons";
import { DialogProvider } from "components/dialog/DialogContext";
import {
  DELIVERABLE_REVIEW_NOTICE_NAME,
  START_REVIEW_BUTTON_NAME,
} from "./sections/PendingReviewNotice";
import { CurrentUser } from "components/user/UserContext";
import { developmentMockUser } from "mock-data/userMocks";

const renderAtRoute = (deliverableId: string) =>
  render(
    <TestProvider routerEntries={[`/deliverables/${deliverableId}`]}>
      <DialogProvider>
        <Routes>
          <Route
            path="/deliverables/:deliverableId"
            element={<DeliverableDetailsManagementPage />}
          />
          <Route path="/deliverables" element={<div>Deliverables list</div>} />
        </Routes>
      </DialogProvider>
    </TestProvider>
  );

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
    },
  ],
});

const buildCurrentUser = (
  personType: CurrentUser["person"]["personType"]
): CurrentUser => ({
  ...developmentMockUser,
  person: { ...developmentMockUser.person, personType },
});

const renderWithDeliverable = (
  deliverable: ReturnType<typeof buildSubmittedDeliverableMock>,
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
          <Route path="/deliverables" element={<div>Deliverables list</div>} />
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

  it("navigates back to the deliverables list", async () => {
    const user = userEvent.setup();
    renderAtRoute("1");

    await user.click(await screen.findByTestId(BACK_TO_DELIVERABLES_BUTTON_NAME));

    expect(screen.getByText("Deliverables list")).toBeInTheDocument();
  });

  it("toggles additional details", async () => {
    const user = userEvent.setup();
    renderAtRoute("1");

    expect(await screen.findByText("See Additional Details")).toBeInTheDocument();
    expect(screen.queryByTestId("deliverable-CMS Owner")).not.toBeInTheDocument();

    await user.click(screen.getByText("See Additional Details"));

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
