import type { GenericDeliverableTableRow } from "pages/DeliverablesPage";

const asDemonstration = (
  id: string,
  name: string,
  stateId: string
): GenericDeliverableTableRow["demonstration"] => ({
  id,
  name,
  state: { id: stateId },
});

const asCmsOwner = (
  id: string,
  fullName: string
): GenericDeliverableTableRow["cmsOwner"] => ({
  id,
  person: {
    id,
    fullName,
  },
});

const mockDeliverable = ({
  id,
  name,
  demonstrationId,
  demonstrationName,
  deliverableType,
  cmsOwnerId,
  cmsOwnerName,
  dueDate,
  status,
  stateId,
}: {
  id: string;
  name: string;
  demonstrationId: string;
  demonstrationName: string;
  deliverableType: string;
  cmsOwnerId: string;
  cmsOwnerName: string;
  dueDate: string;
  status: GenericDeliverableTableRow["status"];
  stateId: string;
}): GenericDeliverableTableRow => ({
  id,
  deliverableType: deliverableType as GenericDeliverableTableRow["deliverableType"],
  name,
  demonstration: asDemonstration(demonstrationId, demonstrationName, stateId),
  status,
  cmsOwner: asCmsOwner(cmsOwnerId, cmsOwnerName),
  dueDate: new Date(dueDate),
  dueDateType: "Normal",
  expectedToBeSubmitted: true,
  cmsDocuments: [],
  stateDocuments: [],
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
});

const RAW_MOCK_DELIVERABLES: GenericDeliverableTableRow[] = [
  mockDeliverable({
    id: "8f3a0c8a-2f9f-4bf0-9a3a-6b7eac31f201",
    name: "Budget Neutrality Report",
    demonstrationId: "demo-1",
    demonstrationName: "Dusty Demo",
    deliverableType: "Vadars Annual BN Report - extention requested = true",
    cmsOwnerId: "ashokatano",
    cmsOwnerName: "Sheev Palpatine",
    dueDate: "2001-07-01",
    status: "Past Due",
    stateId: "CA",
  }),
  mockDeliverable({
    id: "1b6d2e71-4c98-4a26-a8ff-2cbf4af7d2a4",
    name: "AAA This one should be third upcoming newest new due?",
    demonstrationId: "demo-2",
    demonstrationName: "Dusty Demo",
    deliverableType: "Demonstration-Specific Deliverable",
    cmsOwnerId: "dustyrhodes",
    cmsOwnerName: "Dusty Rhodes",
    dueDate: "2026-04-18",
    status: "Upcoming",
    stateId: "NY",
  }),
  mockDeliverable({
    id: "1b6d2e71-4c98-4a26-a8ff-2csf4af7d2a4",
    name: "SHOULD BE Second? Cuz past due",
    demonstrationId: "demo-3",
    demonstrationName: "Dusty Demo",
    deliverableType: "Evaluation Design",
    cmsOwnerId: "dustyrhodes",
    cmsOwnerName: "Ackbar",
    dueDate: "2026-04-15",
    status: "Past Due",
    stateId: "AL",
  }),
  mockDeliverable({
    id: "1b7d2e71-4c98-4a26-a8ff-2cbf4af7d2a4",
    name: "Budget Neutrality Worksheet",
    demonstrationId: "demo-4",
    demonstrationName: "Dusty Demo",
    deliverableType: "HCBS Reporty (1st cuz ext requet = true)",
    cmsOwnerId: "dustyrhodes",
    cmsOwnerName: "Dusty Rhodes 1",
    dueDate: "2024-08-15",
    status: "Upcoming",
    stateId: "NY",
  }),
  mockDeliverable({
    id: "b7045f1e-3d54-44ef-98a4-95f53d2ce8de",
    name: "Ext Request == true",
    demonstrationId: "demo-5",
    demonstrationName: "Dusty Demo",
    deliverableType: "HCBS Deficiency, A/N/E Incident Report (1915(c)-like)",
    cmsOwnerId: "leiaorgana",
    cmsOwnerName: "Dusty Rhodes 1",
    dueDate: "2024-09-30",
    status: "Past Due",
    stateId: "TX",
  }),
  mockDeliverable({
    id: "f0f85d42-451d-4b83-a0f2-bf4f7f194b91",
    name: "Deliverable 4",
    demonstrationId: "demo-6",
    demonstrationName: "ALADEMO",
    deliverableType: "HCBS Evidentiary Report",
    cmsOwnerId: "thearmorer",
    cmsOwnerName: "Dusty Rhodes",
    dueDate: "2024-10-15",
    status: "Upcoming",
    stateId: "NY",
  }),
  mockDeliverable({
    id: "62d286f6-e91f-4680-b43e-845f57fb8c3f",
    name: "Deliverable 5",
    demonstrationId: "demo-7",
    demonstrationName: "Gee Willikers it's cold",
    deliverableType: "Implementation Plan",
    cmsOwnerId: "thebane",
    cmsOwnerName: "CMS Owner E",
    dueDate: "2024-11-01",
    status: "Submitted",
    stateId: "AK",
  }),
  mockDeliverable({
    id: "9c9f7dbe-21a5-4309-81d7-4f5962c39a2f",
    name: "Deliverable 6",
    demonstrationId: "demo-8",
    demonstrationName: "Demonstration F",
    deliverableType: "Interim Evaluation Report",
    cmsOwnerId: "therealbendu",
    cmsOwnerName: "CMS Owner F",
    dueDate: "2024-11-20",
    status: "Upcoming",
    stateId: "GA",
  }),
  mockDeliverable({
    id: "ad7a8f64-c5a6-4f62-8f95-738bf1cc9817",
    name: "Deliverable 7",
    demonstrationId: "demo-9",
    demonstrationName: "Better health for MD demo",
    deliverableType: "Mid-point Assessment",
    cmsOwnerId: "mesaagain",
    cmsOwnerName: "CMS Owner G",
    dueDate: "2024-12-10",
    status: "Approved",
    stateId: "MD",
  }),
  mockDeliverable({
    id: "e4bd3f86-7e2d-4aa0-b6dd-496778901a10",
    name: "Deliverable 8",
    demonstrationId: "demo-10",
    demonstrationName: "Virginia is for livers Liver transplant demo",
    deliverableType: "Monitoring Protocol",
    cmsOwnerId: "ezbridge",
    cmsOwnerName: "CMS Owner H",
    dueDate: "2025-01-05",
    status: "Upcoming",
    stateId: "OH",
  }),
  mockDeliverable({
    id: "7d28b95c-6f70-4cf3-95f3-9e5d3c921e42",
    name: "Second!",
    demonstrationId: "demo-11",
    demonstrationName: "Dusty Demo",
    deliverableType: "Monitoring Report",
    cmsOwnerId: "itsbixie",
    cmsOwnerName: "CMS Owner I",
    dueDate: "1900-01-01",
    status: "Submitted",
    stateId: "WA",
  }),
  mockDeliverable({
    id: "3f11f7ea-c5e9-4b24-9e6f-1c843bf7f9f6",
    name: "Deliverable 10",
    demonstrationId: "demo-12",
    demonstrationName: "Riding the slopes fitness demo",
    deliverableType: "Quarterly Budget Neutrality Report",
    cmsOwnerId: "therealbendu",
    cmsOwnerName: "CMS Owner J",
    dueDate: "2025-03-01",
    status: "Upcoming",
    stateId: "CO",
  }),
  mockDeliverable({
    id: "5f2d5c57-8cc5-4c28-a9b0-89f44b6dc112",
    name: "Montana Monitoring Protocol",
    demonstrationId: "demo-13",
    demonstrationName: "Montana Medicaid Waiver",
    deliverableType: "Monitoring Protocol",
    cmsOwnerId: "mockuser",
    cmsOwnerName: "Mock User",
    dueDate: "2025-03-15",
    status: "Upcoming",
    stateId: "MT",
  }),
  mockDeliverable({
    id: "a7dcfe66-1d03-4d8e-a9d6-a34b4a3297be",
    name: "Montana Interim Evaluation",
    demonstrationId: "demo-14",
    demonstrationName: "Montana Medicaid Waiver",
    deliverableType: "Interim Evaluation Report",
    cmsOwnerId: "mockuser",
    cmsOwnerName: "Mock User",
    dueDate: "2025-04-20",
    status: "Upcoming",
    stateId: "MT",
  }),
];

export const MOCK_DELIVERABLES: GenericDeliverableTableRow[] = RAW_MOCK_DELIVERABLES;

export const getDeliverablesForDemonstration = (
  demonstrationName: string
): GenericDeliverableTableRow[] =>
  MOCK_DELIVERABLES.filter((deliverable) => deliverable.demonstration.name === demonstrationName);
