import { MockedResponse } from "@apollo/client/testing";
import { GET_AMENDMENT_WORKFLOW_QUERY } from "components/application/amendment/AmendmentWorkflow";
import { GET_RENEWAL_WORKFLOW_QUERY } from "components/application/renewal/RenewalWorkflow";

export const MOCK_PHASES = [
  { phaseName: "Concept", phaseStatus: "Not Started", phaseDates: [] },
  { phaseName: "Application Intake", phaseStatus: "Not Started", phaseDates: [] },
  { phaseName: "Completeness", phaseStatus: "Not Started", phaseDates: [] },
  { phaseName: "Federal Comment", phaseStatus: "Not Started", phaseDates: [] },
  { phaseName: "SDG Preparation", phaseStatus: "Not Started", phaseDates: [] },
  { phaseName: "Review", phaseStatus: "Not Started", phaseDates: [], phaseNotes: [] },
  { phaseName: "Approval Package", phaseStatus: "Not Started", phaseDates: [] },
  { phaseName: "Approval Summary", phaseStatus: "Not Started", phaseDates: [] },
] as const;

export const workflowMocks: MockedResponse[] = [
  {
    request: {
      query: GET_AMENDMENT_WORKFLOW_QUERY,
      variables: { id: "1" },
    },
    result: {
      data: {
        amendment: {
          id: "1",
          name: "Test Amendment",
          description: "Test description",
          status: "Pre-Submission",
          currentPhaseName: "Initial Review",
          effectiveDate: "2024-01-01",
          signatureLevel: "Level 1",
          clearanceLevel: "Public",
          demonstration: {
            id: "demo-1",
            name: "Test Demo",
            primaryProjectOfficer: {
              id: "officer-1",
              fullName: "John Doe",
            },
          },
          phases: MOCK_PHASES,
          tags: [],
          documents: [],
        },
      },
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
  },
  {
    request: {
      query: GET_RENEWAL_WORKFLOW_QUERY,
      variables: { id: "1" },
    },
    result: {
      data: {
        renewal: {
          id: "1",
          name: "Test Renewal",
          description: "Test description",
          status: "Pre-Submission",
          currentPhaseName: "Initial Review",
          effectiveDate: "2024-01-01",
          signatureLevel: "Level 1",
          clearanceLevel: "Public",
          demonstration: {
            id: "demo-1",
            name: "Test Demo",
            primaryProjectOfficer: {
              id: "officer-1",
              fullName: "John Doe",
            },
          },
          phases: MOCK_PHASES,
          tags: [],
          documents: [],
        },
      },
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
  },
];
