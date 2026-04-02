type MockDeliverable = {
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
    fullName: string;
  };
};

/*
"Annual Budget Neutrality Report",
  "Close Out Report",
  "Demonstration-Specific Deliverable",
  "Evaluation Design",
  "HCBS Actual and Estimated Enrollment Number Report (1915(i)-like)",
  "HCBS Deficiency, Remediation and A/N/E Incident Report (1915(c)-like)",
  "HCBS Evidentiary Report",
  "HCBS Performance Measures Report",
  "HCBS Quality Improvement Strategy Report",
  "Implementation Plan",
  "Interim Evaluation Report",
  "Mid-point Assessment",
  "Monitoring Protocol",
  "Monitoring Report",
  "Quarterly Budget Neutrality Report",
  "Summative Evaluation Report",
  "Transition Plan",
  */

export const MOCK_DELIVERABLES: MockDeliverable[] = [
  {
    id: "8f3a0c8a-2f9f-4bf0-9a3a-6b7eac31f201",
    deliverableName: "Budget Neutrality Report",
    demonstrationName: "Demonstration A",
    deliverableType: "Annual Budget Neutrality Report",
    cmsOwner: "Ashoka Tano",
    dueDate: "2024-07-01",
    submissionDate: "2024-06-28",
    status: "Upcoming",
    extensionRequested: false,
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
    deliverableName: "Quarterly Report For NYC Demonstration",
    demonstrationName: "NYC Demonstration",
    deliverableType: "Demonstration-Specific Deliverable",
    cmsOwner: "Dusty Rhodes",
    dueDate: "2024-08-15",
    submissionDate: "2024-08-14",
    status: "Upcoming",
    extensionRequested: true,
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
    deliverableName: "Annual Report For NYC Demonstration",
    demonstrationName: "Alabama Health Demonstration",
    deliverableType: "Evaluation Design",
    cmsOwner: "Ackbar",
    dueDate: "2026-04-15",
    submissionDate: "2025-08-14",
    status: "Past Due",
    extensionRequested: true,
    resubmissionCount: 0,
    primaryContact: {
      id: "admiralgialackbar",
      fullName: "Admiral Gial Ackbar",
    },
    state: {
      id: "AL",
    },
  },
  {
    id: "1b7d2e71-4c98-4a26-a8ff-2cbf4af7d2a4",
    deliverableName: "Budget Neutrality Worksheet",
    demonstrationName: "NYC Demonstration",
    deliverableType: "HCBS Actual and Estimated Enrollment Number Report (1915(i)-like)",
    cmsOwner: "Dusty Rhodes",
    dueDate: "2024-08-15",
    submissionDate: "2024-08-14",
    status: "Upcoming",
    extensionRequested: true,
    resubmissionCount: 0,
    primaryContact: {
      id: "dustyrhodes",
      fullName: "Captain Wedge Antilles",
    },
    state: {
      id: "NY",
    },
  },
  {
    id: "b7045f1e-3d54-44ef-98a4-95f53d2ce8de",
    deliverableName: "Deliverable 3",
    demonstrationName: "Demonstration C",
    deliverableType: "HCBS Deficiency, Remediation and A/N/E Incident Report (1915(c)-like)",
    cmsOwner: "CMS Owner C",
    dueDate: "2024-09-30",
    submissionDate: undefined,
    status: "Upcoming",
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
    demonstrationName: "Demonstration D",
    deliverableType: "HCBS Evidentiary Report",
    cmsOwner: "CMS Owner D",
    dueDate: "2024-10-15",
    submissionDate: undefined,
    status: "Upcoming",
    extensionRequested: false,
    resubmissionCount: 1,
    state: {
      id: "FL",
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
    extensionRequested: true,
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
    extensionRequested: true,
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
    deliverableName: "Deliverable 9",
    demonstrationName: "Washington SUD demo",
    deliverableType: "Monitoring Report",
    cmsOwner: "CMS Owner I",
    dueDate: "2025-02-14",
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
];
