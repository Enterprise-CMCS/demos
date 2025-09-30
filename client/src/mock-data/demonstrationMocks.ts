import {
  CREATE_DEMONSTRATION_MUTATION,
} from "components/dialog/demonstration/CreateDemonstrationDialog";
import {
  GET_DEMONSTRATION_BY_ID_QUERY,
  UPDATE_DEMONSTRATION_MUTATION,
} from "components/dialog/demonstration/EditDemonstrationDialog";
import type { BundleStatus } from "demos-server";
import {
  CreateDemonstrationInput,
  Demonstration,
} from "demos-server";
import { GET_DEMONSTRATION_OPTIONS_QUERY } from "hooks/useDemonstrationOptions";
import { DEMONSTRATION_DETAIL_QUERY } from "pages/DemonstrationDetail/DemonstrationDetail";
import { DEMONSTRATIONS_PAGE_QUERY } from "pages/DemonstrationsPage";
import { GET_ALL_DEMONSTRATIONS_QUERY } from "queries/demonstrationQueries";

import { MockedResponse } from "@apollo/client/testing";

import { MockAmendment } from "./amendmentMocks";
import { MockDemonstrationRoleAssignment } from "./demonstrationRoleAssignmentMocks";
import { MockDocument } from "./documentMocks";
import { MockExtension } from "./extensionMocks";
import { mockPeople } from "./personMocks";
import {
  MockState,
  mockStates,
} from "./stateMocks";

export type MockDemonstration = Pick<
  Demonstration,
  "id" | "name" | "description" | "cmcsDivision" | "signatureLevel"
> & {
  effectiveDate: string | null;
  expirationDate: string | null;
  status: BundleStatus;
  state: MockState;
  amendments: MockAmendment[];
  extensions: MockExtension[];
  demonstrationTypes: Array<object>;
  documents: MockDocument[];
  roles: MockDemonstrationRoleAssignment[];
};

export const mockDemonstrations = [
  {
    id: "1",
    name: "Test Demonstration 1",
    description: "A test demonstration.",
    effectiveDate: "2025-01-01T00:00:00.000Z",
    expirationDate: "2025-12-01T00:00:00.000Z",
    status: "Approved",
    cmcsDivision: "Division of System Reform Demonstrations",
    signatureLevel: "OA",
    state: mockStates[0],
    amendments: [],
    extensions: [],
    demonstrationTypes: [],
    documents: [],
    roles: [
      {
        role: "Project Officer",
        isPrimary: true,
        person: mockPeople[0],
      },
    ],
  },
  {
    id: "2",
    name: "Test Demonstration 2",
    description: "Another test demonstration.",
    effectiveDate: "2024-06-15T00:00:00.000Z",
    expirationDate: "2026-06-15T00:00:00.000Z",
    status: "Pre-Submission",
    cmcsDivision: "Division of Eligibility and Coverage Demonstrations",
    signatureLevel: "OCD",
    state: mockStates[1],
    amendments: [],
    extensions: [],
    demonstrationTypes: [],
    documents: [],
    roles: [
      {
        role: "Project Officer",
        isPrimary: true,
        person: mockPeople[1],
      },
    ],
  },
  {
    id: "3",
    name: "Test Demonstration 3",
    description: "A third test demonstration.",
    effectiveDate: "2024-03-01T00:00:00.000Z",
    expirationDate: "2027-03-01T00:00:00.000Z",
    status: "Under Review",
    cmcsDivision: "Division of System Reform Demonstrations",
    signatureLevel: "OGD",
    state: mockStates[2],
    amendments: [],
    extensions: [],
    demonstrationTypes: [],
    documents: [],
    roles: [
      {
        role: "Project Officer",
        isPrimary: true,
        person: mockPeople[2],
      },
    ],
  },
] as const satisfies MockDemonstration[];

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
        demonstrations: mockDemonstrations,
        people: mockPeople,
      },
    },
  },
  {
    request: {
      query: GET_ALL_DEMONSTRATIONS_QUERY,
    },
    result: {
      data: { demonstrations: mockDemonstrations },
    },
  },
  {
    request: {
      query: GET_DEMONSTRATION_BY_ID_QUERY,
      variables: { id: "1" },
    },
    result: {
      data: { demonstration: mockDemonstrations[0] },
    },
  },
  {
    request: {
      query: GET_DEMONSTRATION_BY_ID_QUERY,
      variables: { id: "2" },
    },
    result: {
      data: { demonstration: mockDemonstrations[1] },
    },
  },
  {
    request: {
      query: GET_DEMONSTRATION_BY_ID_QUERY,
      variables: { id: "3" },
    },
    result: {
      data: { demonstration: mockDemonstrations[2] },
    },
  },
  {
    request: {
      query: DEMONSTRATION_DETAIL_QUERY,
      variables: { id: "1" },
    },
    result: {
      data: {
        demonstration: mockDemonstrations[0],
      },
    },
  },
  {
    request: {
      query: DEMONSTRATION_DETAIL_QUERY,
      variables: { id: "2" },
    },
    result: {
      data: {
        demonstration: mockDemonstrations[1],
      },
    },
  },
  {
    request: {
      query: DEMONSTRATION_DETAIL_QUERY,
      variables: { id: "3" },
    },
    result: {
      data: {
        demonstration: mockDemonstrations[2],
      },
    },
  },
  {
    request: {
      query: CREATE_DEMONSTRATION_MUTATION,
      variables: { input: mockAddDemonstrationInput },
    },
    result: {
      data: { createDemonstration: { success: true, message: "Created" } },
    },
  },
  // Update demonstration mock - flexible for various update scenarios
  {
    request: {
      query: UPDATE_DEMONSTRATION_MUTATION,
      variables: {
        id: "1",
        input: {
          name: "Test Demonstration 1",
          description: "A test demonstration.",
          stateId: "AL",
          cmcsDivision: "Division of System Reform Demonstrations",
          signatureLevel: "OA",
        },
      },
    },
    result: {
      data: {
        updateDemonstration: {
          id: "1",
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
        id: "1",
        input: {
          name: "Test Demonstration 123",
          description: "A test demonstration.",
          stateId: "AL",
          cmcsDivision: "Division of System Reform Demonstrations",
          signatureLevel: "OA",
        },
      },
    },
    result: {
      data: {
        updateDemonstration: {
          id: "1",
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
  // Update mock for demonstration 2
  {
    request: {
      query: UPDATE_DEMONSTRATION_MUTATION,
      variables: {
        id: "2",
        input: {
          name: "Test Demonstration 2",
          description: "Another test demonstration.",
          stateId: "AK",
          cmcsDivision: "Division of Eligibility and Coverage Demonstrations",
          signatureLevel: "OCD",
        },
      },
    },
    result: {
      data: {
        updateDemonstration: {
          id: "2",
          name: "Test Demonstration 2",
          description: "Another test demonstration.",
          effectiveDate: "2024-06-15T00:00:00.000Z",
          expirationDate: "2026-06-15T00:00:00.000Z",
          state: {
            id: "AK",
            name: "Alaska",
          },
        },
      },
    },
  },
  // Update mock for demonstration 3
  {
    request: {
      query: UPDATE_DEMONSTRATION_MUTATION,
      variables: {
        id: "3",
        input: {
          name: "Test Demonstration 3",
          description: "A third test demonstration.",
          stateId: "AZ",
          cmcsDivision: "Division of System Reform Demonstrations",
          signatureLevel: "OGD",
        },
      },
    },
    result: {
      data: {
        updateDemonstration: {
          id: "3",
          name: "Test Demonstration 3",
          description: "A third test demonstration.",
          effectiveDate: "2024-03-01T00:00:00.000Z",
          expirationDate: "2027-03-01T00:00:00.000Z",
          state: {
            id: "AZ",
            name: "Arizona",
          },
        },
      },
    },
  },
  {
    request: {
      query: GET_DEMONSTRATION_OPTIONS_QUERY,
    },
    result: {
      data: {
        demonstrations: mockDemonstrations,
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
