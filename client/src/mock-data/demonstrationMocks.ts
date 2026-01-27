import { CREATE_DEMONSTRATION_MUTATION } from "components/dialog/demonstration/CreateDemonstrationDialog";
import {
  GET_DEMONSTRATION_BY_ID_QUERY,
  UPDATE_DEMONSTRATION_MUTATION,
} from "components/dialog/demonstration/EditDemonstrationDialog";
import { GET_DEMONSTRATION_BY_ID_QUERY as HOOK_GET_DEMONSTRATION_BY_ID_QUERY } from "pages/DemonstrationDetail/DemonstrationDetail";
import { GET_WORKFLOW_DEMONSTRATION_QUERY } from "components/application/ApplicationWorkflow";

import type { ApplicationStatus } from "demos-server";
import { CreateDemonstrationInput, Demonstration } from "demos-server";
import { DEMONSTRATION_DETAIL_QUERY } from "pages/DemonstrationDetail/DemonstrationDetail";
import { DEMONSTRATIONS_PAGE_QUERY } from "pages/DemonstrationsPage";

import { MockedResponse } from "@apollo/client/testing";

import { MockAmendment, mockAmendments } from "./amendmentMocks";
import {
  MockDemonstrationRoleAssignment,
  mockDemonstrationRoleAssignments,
} from "./demonstrationRoleAssignmentMocks";
import { MockDocument, mockDocuments } from "./documentMocks";
import { MockExtension, mockExtensions } from "./extensionMocks";
import { mockPeople, MockPerson } from "./personMocks";
import { MockState, mockStates } from "./stateMocks";
import { ASSIGN_DEMONSTRATION_TYPES_DIALOG_QUERY } from "components/dialog/DemonstrationTypes/useApplyDemonstrationTypesDialogData";
import {
  MOCK_DEMONSTRATION_TYPE_ASSIGNMENTS,
  MockDemonstrationTypeAssignment,
} from "./DemonstrationTypeAssignmentMocks";

export type MockDemonstration = Pick<
  Demonstration,
  "id" | "name" | "description" | "sdgDivision" | "signatureLevel" | "currentPhaseName"
> & {
  __typename: "Demonstration";
  effectiveDate: Date;
  expirationDate: Date;
  status: ApplicationStatus;
  state: MockState;
  amendments: MockAmendment[];
  extensions: MockExtension[];
  demonstrationTypes: MockDemonstrationTypeAssignment[];
  documents: MockDocument[];
  roles: MockDemonstrationRoleAssignment[];
  primaryProjectOfficer: MockPerson;
};

export const MOCK_DEMONSTRATION_ID = "1";
export const MOCK_DEMONSTRATION: MockDemonstration = {
  __typename: "Demonstration",
  id: MOCK_DEMONSTRATION_ID,
  name: "Montana Medicaid Waiver",
  description: "A demonstration project in Montana.",
  status: "Approved" as ApplicationStatus,
  effectiveDate: new Date(2025, 1, 1),
  expirationDate: new Date(2025, 2, 1),
  state: mockStates.find((state) => state.id === "MT")!,
  sdgDivision: "Division of System Reform Demonstrations",
  signatureLevel: "OA",
  amendments: mockAmendments.filter((amendment) =>
    amendment.name.includes("Montana Medicaid Waiver")
  ),
  extensions: mockExtensions.filter((extension) =>
    extension.name.includes("Montana Medicaid Waiver")
  ),
  documents: mockDocuments,
  roles: [
    mockDemonstrationRoleAssignments[0],
    mockDemonstrationRoleAssignments[3],
    mockDemonstrationRoleAssignments[4],
  ],
  currentPhaseName: "Concept",
  primaryProjectOfficer: mockPeople[0],
  demonstrationTypes: MOCK_DEMONSTRATION_TYPE_ASSIGNMENTS,
};

export const mockAddDemonstrationInput: CreateDemonstrationInput = {
  name: "New Demonstration",
  description: "New Description",
  stateId: "1",
  projectOfficerUserId: "1",
};

export const demonstrationMocks: MockedResponse[] = [
  {
    request: {
      query: DEMONSTRATIONS_PAGE_QUERY,
    },
    result: {
      data: {
        demonstrations: [MOCK_DEMONSTRATION],
        people: mockPeople,
      },
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
  },
  {
    request: {
      query: HOOK_GET_DEMONSTRATION_BY_ID_QUERY,
      variables: { id: "1" },
    },
    result: {
      data: { demonstration: MOCK_DEMONSTRATION },
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
  },
  {
    request: {
      query: GET_WORKFLOW_DEMONSTRATION_QUERY,
      variables: { id: "1" },
    },
    result: {
      data: {
        demonstration: { ...MOCK_DEMONSTRATION, phases: [] },
      },
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
  },
  {
    request: {
      query: GET_DEMONSTRATION_BY_ID_QUERY,
      variables: { id: "1" },
    },
    result: {
      data: { demonstration: MOCK_DEMONSTRATION },
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
  },
  {
    request: {
      query: ASSIGN_DEMONSTRATION_TYPES_DIALOG_QUERY,
      variables: { id: "1" },
    },
    result: {
      data: { demonstration: MOCK_DEMONSTRATION },
    },
  },
  {
    request: {
      query: DEMONSTRATION_DETAIL_QUERY,
      variables: { id: "1" },
    },
    result: {
      data: {
        demonstration: MOCK_DEMONSTRATION,
      },
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
  },
  // Update demonstration mock - flexible for various update scenarios
  {
    request: {
      query: UPDATE_DEMONSTRATION_MUTATION,
      variables: {
        id: MOCK_DEMONSTRATION_ID,
        input: {
          name: "Test Demonstration 1",
          description: "A test demonstration.",
          stateId: "AL",
          sdgDivision: "Division of System Reform Demonstrations",
          signatureLevel: "OA",
        },
      },
    },
    result: {
      data: {
        updateDemonstration: {
          id: MOCK_DEMONSTRATION_ID,
          name: "Test Demonstration 1",
          description: "A test demonstration.",
          effectiveDate: "2025-01-01T00:00:00.000Z",
          expirationDate: "2025-12-01T00:00:00.000Z",
          state: {
            id: "AL",
            name: "Alabama",
          },
        },
      },
    },
  },
  // Additional update demonstration mock for different field values
  {
    request: {
      query: UPDATE_DEMONSTRATION_MUTATION,
      variables: {
        id: MOCK_DEMONSTRATION_ID,
        input: {
          name: "Test Demonstration 123",
          description: "A test demonstration.",
          stateId: "AL",
          sdgDivision: "Division of System Reform Demonstrations",
          signatureLevel: "OA",
        },
      },
    },
    result: {
      data: {
        updateDemonstration: {
          id: MOCK_DEMONSTRATION_ID,
          name: "Test Demonstration 123",
          description: "A test demonstration.",
          effectiveDate: "2025-01-01T00:00:00.000Z",
          expirationDate: "2025-12-01T00:00:00.000Z",
          state: {
            id: "AL",
            name: "Alabama",
          },
        },
      },
    },
  },

  // Error mock for GET_DEMONSTRATION_BY_ID_QUERY with invalid ID
  {
    request: {
      query: GET_DEMONSTRATION_BY_ID_QUERY,
      variables: { id: "fakeID" },
    },
    error: new Error("Demonstration not found"),
  },
  // Error mock for UPDATE_DEMONSTRATION_MUTATION with invalid data
  {
    request: {
      query: UPDATE_DEMONSTRATION_MUTATION,
      variables: {
        id: "invalid-id",
        input: {
          name: "",
        },
      },
    },
    error: new Error("Demonstration not found or invalid input"),
  },
  // Error mock for ADD_DEMONSTRATION_MUTATION with invalid data
  {
    request: {
      query: CREATE_DEMONSTRATION_MUTATION,
      variables: { input: { name: "bad add demonstration" } },
    },
    error: new Error("Failed to add demonstration"),
  },
];
