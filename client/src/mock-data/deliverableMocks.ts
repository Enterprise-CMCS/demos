import { MockedResponse } from "@apollo/client/testing";
import { DELIVERABLE_DEMONSTRATION_ID_QUERY } from "pages/DemonstrationDetail/DemonstrationDetail";
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
    id: "1",
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

export const MOCK_DELIVERABLE_2: DeliverableDetailsManagementDeliverable = {
  ...MOCK_DELIVERABLE_1,
  id: MOCK_DELIVERABLE_TABLE_ROW.id,
  name: MOCK_DELIVERABLE_TABLE_ROW.name,
  deliverableType: MOCK_DELIVERABLE_TABLE_ROW.deliverableType,
  demonstration: {
    ...MOCK_DELIVERABLE_1.demonstration,
    id: MOCK_DELIVERABLE_TABLE_ROW.demonstration.id,
    name: MOCK_DELIVERABLE_TABLE_ROW.demonstration.name,
    state: MOCK_DELIVERABLE_TABLE_ROW.demonstration.state,
  },
  cmsOwner: {
    person: {
      fullName: MOCK_DELIVERABLE_TABLE_ROW.cmsOwner.person.fullName,
    },
  },
  dueDate: MOCK_DELIVERABLE_TABLE_ROW.dueDate,
  status: MOCK_DELIVERABLE_TABLE_ROW.status,
};

const deliverableDetailMocks = [MOCK_DELIVERABLE_1, MOCK_DELIVERABLE_2].flatMap((deliverable) => [
  {
    request: {
      query: DELIVERABLE_DETAILS_QUERY,
      variables: { id: deliverable.id },
    },
    result: {
      data: {
        deliverable,
      },
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
  },
  {
    request: {
      query: DELIVERABLE_DEMONSTRATION_ID_QUERY,
      variables: { deliverableId: deliverable.id },
    },
    result: {
      data: {
        deliverable: {
          id: deliverable.id,
          demonstration: {
            id: deliverable.demonstration.id,
          },
        },
      },
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
  },
  {
    request: {
      query: DELIVERABLE_DETAIL_HEADER_QUERY,
      variables: { deliverableId: deliverable.id },
    },
    result: {
      data: {
        deliverable: {
          id: deliverable.id,
          demonstration: {
            id: deliverable.demonstration.id,
          },
        },
      },
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
  },
]);

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
  ...deliverableDetailMocks,
];
