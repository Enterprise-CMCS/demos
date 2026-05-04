import { MockedResponse } from "@apollo/client/testing";
import { DELIVERABLE_DETAIL_HEADER_QUERY } from "pages/deliverables/DeliverableDetailHeader";
import {
  DELIVERABLE_DETAILS_QUERY,
  DeliverableDetailsManagementDeliverable,
} from "pages/deliverables/DeliverableDetailsManagementPage";
import {
  DELIVERABLES_PAGE_QUERY,
  DeliverableTableRow,
} from "components/table/tables/DeliverableTable";

export const MOCK_DELIVERABLE_TABLE_ROW: DeliverableTableRow = {
  id: "8f3a0c8a-2f9f-4bf0-9a3a-6b7eac31f201",
  name: "Budget Neutrality Report",
  demonstration: {
    id: "demo-1",
    name: "Dusty Demo",
    state: {
      id: "CA",
    },
    demonstrationTypes: [],
  },
  cmsOwner: {
    id: "",
    person: {
      id: "ashokatano",
      fullName: "Ahsoka Tano",
    },
  },
  deliverableType: "Annual Budget Neutrality Report",
  dueDate: new Date("2024-07-01"),
  status: "Upcoming",
  demonstrationTypes: [],
};

export const MOCK_DELIVERABLE_1: DeliverableDetailsManagementDeliverable = {
  id: "1",
  name: "Mock Deliverable 1",
  deliverableType: "Monitoring Report",
  demonstration: {
    id: "1",
    name: "Demonstration 1",
    expirationDate: new Date("2026-12-31"),
    state: {
      id: "CA",
    },
  },
  cmsOwner: {
    person: {
      fullName: "Mock User",
    },
  },
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
    },
  ],
};

export const deliverableMocks: MockedResponse[] = [
  {
    request: {
      query: DELIVERABLES_PAGE_QUERY,
    },
    result: {
      data: {
        deliverables: [MOCK_DELIVERABLE_1, MOCK_DELIVERABLE_TABLE_ROW],
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
