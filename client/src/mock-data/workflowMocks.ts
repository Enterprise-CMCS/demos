import { MockedResponse } from "@apollo/client/testing";
import { GET_AMENDMENT_WORKFLOW_QUERY } from "components/application/amendment/AmendmentWorkflow";
import { GET_EXTENSION_WORKFLOW_QUERY } from "components/application/extension/ExtensionWorkflow";

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
          phases: [],
          tags: [],
          documents: [],
        },
      },
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
  },
  {
    request: {
      query: GET_EXTENSION_WORKFLOW_QUERY,
      variables: { id: "1" },
    },
    result: {
      data: {
        extension: {
          id: "1",
          name: "Test Extension",
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
          phases: [],
          tags: [],
          documents: [],
        },
      },
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
  },
];
