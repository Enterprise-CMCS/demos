import { MockedResponse } from "@apollo/client/testing";
import { DELIVERABLE_DETAIL_HEADER_QUERY } from "pages/deliverables/DeliverableDetailHeader";
import {
  DELIVERABLE_DETAILS_QUERY,
  DeliverableDetailsManagementDeliverable,
} from "pages/deliverables/DeliverableDetailsManagementPage";
import { DELIVERABLES_PAGE_QUERY, type GenericDeliverableTableRow } from "pages/DeliverablesPage";

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

const makeDeliverable = (seed: DeliverableSeed): GenericDeliverableTableRow => {
  const dueDate = new Date(`${seed.dueDate}T00:00:00.000Z`);
  return {
    id: seed.id,
    name: seed.name,
    deliverableType: seed.deliverableType as GenericDeliverableTableRow["deliverableType"],
    demonstration: {
      id: seed.demonstrationId,
      name: seed.demonstrationName,
      state: {
        id: seed.stateId,
      },
    },
    status: seed.status as GenericDeliverableTableRow["status"],
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

export const MOCK_DELIVERABLES: GenericDeliverableTableRow[] = [
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
    id: "1b6d2e71-4c98-4a26-a8ff-2csf4af7d2a4",
    name: "Annual Report For AL Demonstration",
    demonstrationId: "demo-3",
    demonstrationName: "Dusty Demo",
    deliverableType: "Evaluation Design",
    cmsOwnerId: "admiralgialackbar",
    cmsOwnerName: "Admiral Ackbar",
    dueDate: "2026-04-15",
    status: "Past Due",
    stateId: "AL",
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
  makeDeliverable({
    id: "b7045f1e-3d54-44ef-98a4-95f53d2ce8de",
    name: "Deliverable 3",
    demonstrationId: "demo-5",
    demonstrationName: "Demonstration E",
    deliverableType: "HCBS Deficiency, Remediation and A/N/E Incident Report (1915(c)-like)",
    cmsOwnerId: "leiaorgana",
    cmsOwnerName: "Leia Organa",
    dueDate: "2024-09-30",
    status: "Upcoming",
    stateId: "TX",
  }),
  makeDeliverable({
    id: "f0f85d42-451d-4b83-a0f2-bf4f7f194b91",
    name: "Deliverable 4",
    demonstrationId: "demo-6",
    demonstrationName: "ALADEMO",
    deliverableType: "HCBS Evidentiary Report",
    cmsOwnerId: "thearmorer",
    cmsOwnerName: "The Armorer",
    dueDate: "2024-10-15",
    status: "Upcoming",
    stateId: "FL",
  }),
  makeDeliverable({
    id: "62d286f6-e91f-4680-b43e-845f57fb8c3f",
    name: "Deliverable 5",
    demonstrationId: "demo-7",
    demonstrationName: "Gee Willikers it's cold",
    deliverableType: "Implementation Plan",
    cmsOwnerId: "thebane",
    cmsOwnerName: "Cad Bane",
    dueDate: "2024-11-01",
    status: "Submitted",
    stateId: "AK",
  }),
  makeDeliverable({
    id: "9c9f7dbe-21a5-4309-81d7-4f5962c39a2f",
    name: "Deliverable 6",
    demonstrationId: "demo-8",
    demonstrationName: "Demonstration F",
    deliverableType: "Interim Evaluation Report",
    cmsOwnerId: "therealbendu",
    cmsOwnerName: "The Bendu",
    dueDate: "2024-11-20",
    status: "Upcoming",
    stateId: "GA",
  }),
  makeDeliverable({
    id: "ad7a8f64-c5a6-4f62-8f95-738bf1cc9817",
    name: "Deliverable 7",
    demonstrationId: "demo-9",
    demonstrationName: "Better health for MD demo",
    deliverableType: "Mid-point Assessment",
    cmsOwnerId: "mesaagain",
    cmsOwnerName: "Jar Jar Binks",
    dueDate: "2024-12-10",
    status: "Approved",
    stateId: "MD",
  }),
  makeDeliverable({
    id: "e4bd3f86-7e2d-4aa0-b6dd-496778901a10",
    name: "Deliverable 8",
    demonstrationId: "demo-10",
    demonstrationName: "Virginia is for livers",
    deliverableType: "Monitoring Protocol",
    cmsOwnerId: "ezbridge",
    cmsOwnerName: "Ezra Bridger",
    dueDate: "2025-01-05",
    status: "Upcoming",
    stateId: "OH",
  }),
  makeDeliverable({
    id: "7d28b95c-6f70-4cf3-95f3-9e5d3c921e42",
    name: "Deliverable 9",
    demonstrationId: "demo-11",
    demonstrationName: "Washington SUD demo",
    deliverableType: "Monitoring Report",
    cmsOwnerId: "itsbixie",
    cmsOwnerName: "Bix Caleen",
    dueDate: "2025-02-14",
    status: "Submitted",
    stateId: "WA",
  }),
  makeDeliverable({
    id: "3f11f7ea-c5e9-4b24-9e6f-1c843bf7f9f6",
    name: "Deliverable 10",
    demonstrationId: "demo-12",
    demonstrationName: "Riding the slopes fitness demo",
    deliverableType: "Quarterly Budget Neutrality Report",
    cmsOwnerId: "dustyrhodes",
    cmsOwnerName: "Dusty Rhodes",
    dueDate: "2025-03-01",
    status: "Upcoming",
    stateId: "CO",
  }),
];

export const getDeliverablesForDemonstration = (
  demonstrationName: string
): GenericDeliverableTableRow[] =>
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
