import { MockedResponse } from "@apollo/client/testing";
import { DELIVERABLE_DETAIL_HEADER_QUERY } from "pages/deliverables/DeliverableDetailHeader";
import {
  DELIVERABLE_DETAILS_QUERY,
  DeliverableDetailsManagementDeliverable,
} from "pages/deliverables/DeliverableDetailsManagementPage";
import { DELIVERABLES_PAGE_QUERY, type DeliverableTableRow } from "pages/DeliverablesPage";

type DeliverableSeed = {
  id: string;
  name: string;
  demonstrationId: string;
  demonstrationName: string;
  deliverableType: string;
  cmsOwnerId: string;
  cmsOwnerName: string;
  dueDate: string;
  status: string;
  stateId: string;
};

const makeDeliverable = (seed: DeliverableSeed): DeliverableTableRow => {
  const dueDate = new Date(`${seed.dueDate}T00:00:00.000Z`);
  return {
    id: seed.id,
    name: seed.name,
    deliverableType: seed.deliverableType as DeliverableTableRow["deliverableType"],
    demonstration: {
      id: seed.demonstrationId,
      name: seed.demonstrationName,
      state: {
        id: seed.stateId,
      },
      demonstrationTypes: [],
    },
    status: seed.status as DeliverableTableRow["status"],
    cmsOwner: {
      id: seed.cmsOwnerId,
      person: {
        id: seed.cmsOwnerId,
        fullName: seed.cmsOwnerName,
      },
    },
    dueDate,
    dueDateType: "Normal",
    expectedToBeSubmitted: true,
    cmsDocuments: [],
    stateDocuments: [],
    createdAt: dueDate,
    updatedAt: dueDate,
  };
};

export const MOCK_DELIVERABLES: DeliverableTableRow[] = [
  makeDeliverable({
    id: "8f3a0c8a-2f9f-4bf0-9a3a-6b7eac31f201",
    name: "Budget Neutrality Report",
    demonstrationId: "demo-1",
    demonstrationName: "Dusty Demo",
    deliverableType: "Annual Budget Neutrality Report",
    cmsOwnerId: "ashokatano",
    cmsOwnerName: "Ahsoka Tano",
    dueDate: "2024-07-01",
    status: "Upcoming",
    stateId: "CA",
  }),
  makeDeliverable({
    id: "1b6d2e71-4c98-4a26-a8ff-2cbf4af7d2a4",
    name: "Quarterly Report For NYC Demonstration",
    demonstrationId: "demo-2",
    demonstrationName: "Dusty Demo",
    deliverableType: "Demonstration-Specific Deliverable",
    cmsOwnerId: "dustyrhodes",
    cmsOwnerName: "Dusty Rhodes",
    dueDate: "2024-08-15",
    status: "Upcoming",
    stateId: "NY",
  }),
  makeDeliverable({
    id: "1b7d2e71-4c98-4a26-a8ff-2cbf4af7d2a4",
    name: "Budget Neutrality Worksheet",
    demonstrationId: "demo-4",
    demonstrationName: "ALADEMO",
    deliverableType: "HCBS Actual and Estimated Enrollment Number Report (1915(i)-like)",
    cmsOwnerId: "dustyrhodes",
    cmsOwnerName: "Dusty Rhodes",
    dueDate: "2024-08-15",
    status: "Upcoming",
    stateId: "NY",
  }),
];

export const getDeliverablesForDemonstration = (demonstrationName: string): DeliverableTableRow[] =>
  MOCK_DELIVERABLES.filter((deliverable) => deliverable.demonstration.name === demonstrationName);

export const MOCK_DELIVERABLE_1: DeliverableDetailsManagementDeliverable = {
  id: "1",
  deliverableType: "Monitoring Report",
  demonstration: {
    id: "1",
    name: "Demonstration 1",
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
};

export const deliverableMocks: MockedResponse[] = [
  {
    request: {
      query: DELIVERABLES_PAGE_QUERY,
    },
    result: {
      data: {
        deliverables: MOCK_DELIVERABLES,
      },
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
  },
  {
    request: {
      query: DELIVERABLE_DETAILS_QUERY,
      variables: { id: "1" },
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
      variables: { deliverableId: "1" },
    },
    result: {
      data: {
        deliverable: {
          id: "1",
          demonstration: {
            id: "1",
          },
        },
      },
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
  },
];
