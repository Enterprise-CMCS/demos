import { MockedResponse } from "@apollo/client/testing";
import { DELIVERABLE_DETAIL_HEADER_QUERY } from "pages/deliverables/DeliverableDetailHeader";
import {
  DELIVERABLE_DETAILS_QUERY,
  DeliverableDetailsManagementDeliverable,
} from "pages/deliverables/DeliverableDetailsManagementPage";
import { DELIVERABLES_PAGE_QUERY } from "components/table/tables/DeliverableTable";
import { DEMONSTRATION_DELIVERABLE_TAB } from "pages/DemonstrationDetail/deliverables/DeliverablesTab";

export const MOCK_DELIVERABLE_1: DeliverableDetailsManagementDeliverable = {
  id: "1",
  name: "Mock Deliverable 1",
  deliverableType: "Monitoring Report",
  allowedDocumentTypes: ["Monitoring Report", "General File"],
  demonstration: {
    id: "1",
    name: "Demonstration 1",
    expirationPlainDate: "2026-12-31",
    state: {
      id: "CA",
      name: "California",
    },
    demonstrationTypes: [],
  },
  cmsOwner: {
    id: "mock-user",
    person: {
      id: "mock-user-person",
      fullName: "Mock User",
    },
  },
  demonstrationTypes: [],
  dueDate: new Date("2024-08-15"),
  status: "Upcoming",
  stateDocuments: [
    {
      id: "state-file-1",
      name: "Example File",
      description: "CMS guidelines for service utilization reporting requirements",
      documentType: "General File",
      createdAt: new Date("2026-03-23"),
      owner: { person: { fullName: "Florida State" } },
      deliverableSubmissionAction: {
        actionTimestamp: new Date("2026-03-23"),
      },
    },
  ],
  cmsDocuments: [
    {
      id: "cms-file-1",
      name: "Screenshot 2026-03-10 074301.png",
      description: "Here is a file that we have added for you",
      documentType: "General File",
      createdAt: new Date("2026-03-24"),
      owner: { person: { fullName: "Tess Davenport" } },
      deliverableSubmissionAction: {
        actionTimestamp: new Date("2026-03-24"),
      },
    },
  ],
  deliverableActions: [
    {
      id: "action-0",
      actionType: "Created Deliverable Slot",
      actionTimestamp: new Date("2026-03-20T10:00:00Z"),
      userFullName: "System",
      details: "",
    },
    {
      id: "action-1",
      actionType: "Requested Resubmission",
      actionTimestamp: new Date("2026-03-21T10:00:00Z"),
      userFullName: "Mock CMS User (CMS User)",
      details:
        "Old Due Date: 03/15/2026\nNew Due Date: 04/15/2026\nReason Details: Please resubmit with corrected figures.",
    },
  ],
  extensionRequests: [],
};

export const deliverableMocks: MockedResponse[] = [
  {
    request: {
      query: DEMONSTRATION_DELIVERABLE_TAB,
      variables: { id: "demo-does-not-exist" },
    },
    result: {
      data: {
        demonstration: {
          deliverables: [],
        },
      },
    },
  },
  {
    request: {
      query: DEMONSTRATION_DELIVERABLE_TAB,
      variables: { id: "1" },
    },
    result: {
      data: {
        demonstration: {
          deliverables: [MOCK_DELIVERABLE_1],
        },
      },
    },
  },
  {
    request: {
      query: DELIVERABLES_PAGE_QUERY,
    },
    result: {
      data: {
        deliverables: [MOCK_DELIVERABLE_1],
      },
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
  },
  {
    request: {
      query: DELIVERABLE_DETAILS_QUERY,
      variables: { id: MOCK_DELIVERABLE_1.id },
    },
    result: {
      data: {
        deliverable: MOCK_DELIVERABLE_1,
      },
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
  },
  {
    request: {
      query: DELIVERABLE_DETAIL_HEADER_QUERY,
      variables: { deliverableId: MOCK_DELIVERABLE_1.id },
    },
    result: {
      data: {
        deliverable: {
          id: MOCK_DELIVERABLE_1.id,
          demonstration: {
            id: MOCK_DELIVERABLE_1.demonstration.id,
          },
        },
      },
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
  },
];
