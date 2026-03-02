import { WorkflowApplication, ApplicationWorkflowDocument } from "components/application";

const mockDocumentOwner = { person: { fullName: "Jane Smith" } };

const mockDocuments: ApplicationWorkflowDocument[] = [
  {
    id: "doc-1",
    name: "Pre-Submission Document",
    description: "Initial pre-submission materials",
    documentType: "Pre-Submission",
    phaseName: "Concept",
    createdAt: new Date(2025, 0, 15),
    owner: mockDocumentOwner,
  },
  {
    id: "doc-2",
    name: "Application Package",
    description: "Complete application submission package",
    documentType: "General File",
    phaseName: "Application Intake",
    createdAt: new Date(2025, 1, 1),
    owner: mockDocumentOwner,
  },
];

export const mockWorkflowApplication: WorkflowApplication = {
  id: "app-mock-1",
  currentPhaseName: "Application Intake",
  clearanceLevel: "CMS (OSORA)",
  tags: [],
  documents: mockDocuments,
  phases: [
    {
      phaseName: "Concept",
      phaseStatus: "Completed",
      phaseDates: [
        {
          dateType: "Concept Start Date",
          dateValue: new Date(2025, 0, 10),
        },
        {
          dateType: "Concept Completion Date",
          dateValue: new Date(2025, 0, 20),
        },
        {
          dateType: "Pre-Submission Submitted Date",
          dateValue: new Date(2025, 0, 15),
        },
      ],
      phaseNotes: [],
    },
    {
      phaseName: "Application Intake",
      phaseStatus: "Started",
      phaseDates: [
        {
          dateType: "Application Intake Start Date",
          dateValue: new Date(2025, 0, 21),
        },
        {
          dateType: "State Application Submitted Date",
          dateValue: new Date(2025, 1, 1),
        },
      ],
      phaseNotes: [],
    },
    {
      phaseName: "Completeness",
      phaseStatus: "Not Started",
      phaseDates: [],
      phaseNotes: [],
    },
    {
      phaseName: "Federal Comment",
      phaseStatus: "Not Started",
      phaseDates: [],
      phaseNotes: [],
    },
    {
      phaseName: "SDG Preparation",
      phaseStatus: "Not Started",
      phaseDates: [],
      phaseNotes: [],
    },
    {
      phaseName: "Review",
      phaseStatus: "Not Started",
      phaseDates: [],
      phaseNotes: [],
    },
    {
      phaseName: "Approval Package",
      phaseStatus: "Not Started",
      phaseDates: [],
      phaseNotes: [],
    },
    {
      phaseName: "Approval Summary",
      phaseStatus: "Not Started",
      phaseDates: [],
      phaseNotes: [],
    },
  ],
};
