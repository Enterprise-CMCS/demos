type RawMockDeliverable = {
  id: string;
  deliverableName: string;
  demonstrationName: string;
  deliverableType: string;
  cmsOwner: string;
  dueDate: string;
  submissionDate?: string;
  status: string;
  extensionRequested?: boolean;
  resubmissionCount?: number;
  state: {
    id: string;
  };
  primaryContact?: {
    id: string;
    fullName?: string;
  };
};

export type MockDeliverable = {
  id: string;
  deliverableType: string;
  name: string;
  demonstration: {
    id: string;
    name: string;
    state: {
      id: string;
    };
  };
  status: string;
  cmsOwner: {
    id: string;
    person: {
      fullName: string;
    };
  };
  dueDate: string;
  dueDateType: string;
  expectedToBeSubmitted: boolean;
  cmsDocuments: { id: string }[];
  stateDocuments: { id: string }[];
  createdAt: string;
  updatedAt: string;
};

const RAW_MOCK_DELIVERABLES: RawMockDeliverable[] = [
  {
    id: "8f3a0c8a-2f9f-4bf0-9a3a-6b7eac31f201",
    deliverableName: "Budget Neutrality Report",
    demonstrationName: "Dusty Demo",
    deliverableType: "Vadars Annual BN Report - extention requested = true",
    cmsOwner: "Sheev Palpatine",
    dueDate: "2001-07-01",
    submissionDate: "2024-06-28",
    status: "Past Due",
    extensionRequested: true,
    resubmissionCount: 0,
    primaryContact: {
      id: "ashokatano",
      fullName: "Ashoka Tano",
    },
    state: {
      id: "CA",
    },
  },
  {
    id: "1b6d2e71-4c98-4a26-a8ff-2cbf4af7d2a4",
    deliverableName: "AAA This one should be third upcoming newest new due?",
    demonstrationName: "Dusty Demo",
    deliverableType: "Demonstration-Specific Deliverable",
    cmsOwner: "Dusty Rhodes",
    dueDate: "2026-04-18",
    submissionDate: "2024-08-14",
    status: "Upcoming",
    extensionRequested: false,
    resubmissionCount: 0,
    primaryContact: {
      id: "dustyrhodes",
      fullName: "Dusty Rhodes",
    },
    state: {
      id: "NY",
    },
  },
  {
    id: "1b6d2e71-4c98-4a26-a8ff-2csf4af7d2a4",
    deliverableName: "SHOULD BE Second? Cuz past due",
    demonstrationName: "Dusty Demo",
    deliverableType: "Evaluation Design",
    cmsOwner: "Ackbar",
    dueDate: "2026-04-15",
    submissionDate: "2025-08-14",
    status: "Past Due",
    extensionRequested: false,
    resubmissionCount: 0,
    primaryContact: {
      id: "dustyrhodes",
      fullName: "Admiral Gial Ackbar",
    },
    state: {
      id: "AL",
    },
  },
  {
    id: "1b7d2e71-4c98-4a26-a8ff-2cbf4af7d2a4",
    deliverableName: "Budget Neutrality Worksheet",
    demonstrationName: "Dusty Demo",
    deliverableType: "HCBS Reporty (1st cuz ext requet = true)",
    cmsOwner: "Dusty Rhodes 1",
    dueDate: "2024-08-15",
    submissionDate: "2024-08-14",
    status: "Upcoming",
    extensionRequested: true,
    resubmissionCount: 0,
    primaryContact: {
      id: "dustyrhodes",
      fullName: "Dusty Rhodes 1",
    },
    state: {
      id: "NY",
    },
  },
  {
    id: "b7045f1e-3d54-44ef-98a4-95f53d2ce8de",
    deliverableName: "Ext Request == true",
    demonstrationName: "Dusty Demo",
    deliverableType: "HCBS Deficiency, A/N/E Incident Report (1915(c)-like)",
    cmsOwner: "Dusty Rhodes 1",
    dueDate: "2024-09-30",
    submissionDate: undefined,
    status: "Past Due",
    extensionRequested: true,
    resubmissionCount: 2,
    primaryContact: {
      id: "leiaorgana",
      fullName: "Leia Organa",
    },
    state: {
      id: "TX",
    },
  },
  {
    id: "f0f85d42-451d-4b83-a0f2-bf4f7f194b91",
    deliverableName: "Deliverable 4",
    demonstrationName: "ALADEMO",
    deliverableType: "HCBS Evidentiary Report",
    cmsOwner: "Dusty Rhodes",
    dueDate: "2024-10-15",
    submissionDate: undefined,
    status: "Upcoming",
    extensionRequested: false,
    resubmissionCount: 1,
    state: {
      id: "dustyrhodes",
    },
    primaryContact: {
      id: "thearmorer",
      fullName: "The Armorer",
    },
  },
  {
    id: "62d286f6-e91f-4680-b43e-845f57fb8c3f",
    deliverableName: "Deliverable 5",
    demonstrationName: "Gee Willikers it's cold",
    deliverableType: "Implementation Plan",
    cmsOwner: "CMS Owner E",
    dueDate: "2024-11-01",
    submissionDate: "2024-10-30",
    status: "Submitted",
    extensionRequested: false,
    resubmissionCount: 0,
    primaryContact: {
      id: "thebane",
      fullName: "Cad Bane",
    },
    state: {
      id: "AK",
    },
  },
  {
    id: "9c9f7dbe-21a5-4309-81d7-4f5962c39a2f",
    deliverableName: "Deliverable 6",
    demonstrationName: "Demonstration F",
    deliverableType: "Interim Evaluation Report",
    cmsOwner: "CMS Owner F",
    dueDate: "2024-11-20",
    submissionDate: undefined,
    status: "Upcoming",
    extensionRequested: false,
    resubmissionCount: 0,
    primaryContact: {
      id: "therealbendu",
      fullName: "The Bendu",
    },
    state: {
      id: "GA",
    },
  },
  {
    id: "ad7a8f64-c5a6-4f62-8f95-738bf1cc9817",
    deliverableName: "Deliverable 7",
    demonstrationName: "Better health for MD demo",
    deliverableType: "Mid-point Assessment",
    cmsOwner: "CMS Owner G",
    dueDate: "2024-12-10",
    submissionDate: "2024-12-09",
    status: "Approved",
    extensionRequested: false,
    resubmissionCount: 0,
    primaryContact: {
      id: "mesaagain",
      fullName: "Senator Jar Jar Binks",
    },
    state: {
      id: "MD",
    },
  },
  {
    id: "e4bd3f86-7e2d-4aa0-b6dd-496778901a10",
    deliverableName: "Deliverable 8",
    demonstrationName: "Virginia is for livers Liver transplant demo",
    deliverableType: "Monitoring Protocol",
    cmsOwner: "CMS Owner H",
    dueDate: "2025-01-05",
    submissionDate: undefined,
    status: "Upcoming",
    extensionRequested: false,
    resubmissionCount: 3,
    primaryContact: {
      id: "ezbridge",
      fullName: "Ezra Bridger",
    },
    state: {
      id: "OH",
    },
  },
  {
    id: "7d28b95c-6f70-4cf3-95f3-9e5d3c921e42",
    deliverableName: "Second!",
    demonstrationName: "Dusty Demo",
    deliverableType: "Monitoring Report",
    cmsOwner: "CMS Owner I",
    dueDate: "1900-01-01",
    submissionDate: "2025-02-12",
    status: "Submitted",
    extensionRequested: false,
    resubmissionCount: 0,
    primaryContact: {
      id: "itsbixie",
      fullName: "Bix Caleen",
    },
    state: {
      id: "WA",
    },
  },
  {
    id: "3f11f7ea-c5e9-4b24-9e6f-1c843bf7f9f6",
    deliverableName: "Deliverable 10",
    demonstrationName: "Riding the slopes fitness demo",
    deliverableType: "Quarterly Budget Neutrality Report",
    cmsOwner: "CMS Owner J",
    dueDate: "2025-03-01",
    submissionDate: undefined,
    status: "Upcoming",
    extensionRequested: false,
    resubmissionCount: 0,
    primaryContact: {
      id: "therealbendu",
      fullName: "The Bendu",
    },
    state: {
      id: "CO",
    },
  },
  {
    id: "5f2d5c57-8cc5-4c28-a9b0-89f44b6dc112",
    deliverableName: "Montana Monitoring Protocol",
    demonstrationName: "Montana Medicaid Waiver",
    deliverableType: "Monitoring Protocol",
    cmsOwner: "Mock User",
    dueDate: "2025-03-15",
    submissionDate: undefined,
    status: "Upcoming",
    extensionRequested: false,
    resubmissionCount: 1,
    primaryContact: {
      id: "mockuser",
      fullName: "Mock User",
    },
    state: {
      id: "MT",
    },
  },
  {
    id: "a7dcfe66-1d03-4d8e-a9d6-a34b4a3297be",
    deliverableName: "Montana Interim Evaluation",
    demonstrationName: "Montana Medicaid Waiver",
    deliverableType: "Interim Evaluation Report",
    cmsOwner: "Mock User",
    dueDate: "2025-04-20",
    submissionDate: "2025-04-18",
    status: "Upcoming",
    extensionRequested: false,
    resubmissionCount: 0,
    primaryContact: {
      id: "mockuser",
      fullName: "Mock User",
    },
    state: {
      id: "MT",
    },
  },
];

export const getDeliverablesForDemonstration = (
  demonstrationName: string
): MockDeliverable[] =>
  MOCK_DELIVERABLES.filter((deliverable) => deliverable.demonstration.name === demonstrationName);

export const MOCK_DELIVERABLES: MockDeliverable[] = RAW_MOCK_DELIVERABLES.map(
  (deliverable, index) => ({
    id: deliverable.id,
    deliverableType: deliverable.deliverableType,
    name: deliverable.deliverableName,
    demonstration: {
      id: `demo-${index + 1}`,
      name: deliverable.demonstrationName,
      state: {
        id: deliverable.state.id,
      },
    },
    status: deliverable.status,
    cmsOwner: {
      id: deliverable.primaryContact?.id ?? `cms-owner-${index + 1}`,
      person: {
        fullName: deliverable.cmsOwner,
      },
    },
    dueDate: deliverable.dueDate,
    dueDateType: "Normal",
    expectedToBeSubmitted: true,
    cmsDocuments: [],
    stateDocuments: [],
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  })
);
