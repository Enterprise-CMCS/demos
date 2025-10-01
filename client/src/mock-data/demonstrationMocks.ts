import { CreateDemonstrationInput, Demonstration } from "demos-server";
import { GET_ALL_DEMONSTRATIONS_QUERY } from "queries/demonstrationQueries";
import { DEMONSTRATION_DETAIL_QUERY } from "pages/DemonstrationDetail/DemonstrationDetail";
import { DEMONSTRATIONS_PAGE_QUERY } from "pages/DemonstrationsPage";
import { MockedResponse } from "@apollo/client/testing";
import { MockState, mockStates } from "./stateMocks";
import { MockAmendment, mockAmendments } from "./amendmentMocks";
import { MockExtension, mockExtensions } from "./extensionMocks";
import { MockDocument, mockDocuments } from "./documentMocks";
import { GET_DEMONSTRATION_OPTIONS_QUERY } from "hooks/useDemonstrationOptions";
import type { BundleStatus } from "demos-server";
import {
  mockDemonstrationRoleAssignments,
  MockDemonstrationRoleAssignment,
} from "./demonstrationRoleAssignmentMocks";
import { mockPeople } from "./personMocks";
import { mockUsers } from "./userMocks";
import { STATES_AND_TERRITORIES } from "demos-server-constants";
import { CREATE_DEMONSTRATION_MUTATION } from "components/dialog/demonstration/CreateDemonstrationDialog";
import {
  GET_DEMONSTRATION_BY_ID_QUERY,
  UPDATE_DEMONSTRATION_MUTATION,
} from "components/dialog/demonstration/EditDemonstrationDialog";

export type MockDemonstration = Pick<
  Demonstration,
  "id" | "name" | "description" | "effectiveDate" | "expirationDate"
> & {
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
    name: "Montana Medicaid Waiver",
    description: "A demonstration project in Montana.",
    effectiveDate: new Date(2025, 0, 1),
    expirationDate: new Date(2025, 11, 1),
    status: "Approved",
    state: mockStates.find((state) => state.id === "MT")!,
    amendments: [mockAmendments[0], mockAmendments[1], mockAmendments[5]],
    extensions: [mockExtensions[0], mockExtensions[1], mockExtensions[2]],
    demonstrationTypes: [],
    documents: [mockDocuments[0], mockDocuments[1], mockDocuments[2]],
    roles: [
      mockDemonstrationRoleAssignments[0],
      mockDemonstrationRoleAssignments[3],
      mockDemonstrationRoleAssignments[4],
    ],
  },
  {
    id: "2",
    name: "Florida Health Innovation",
    description: "A health innovation project in Florida.",
    effectiveDate: new Date(2025, 0, 2),
    expirationDate: new Date(2025, 11, 2),
    status: "Pre-Submission",
    state: mockStates.find((state) => state.id === "FL")!,
    amendments: [mockAmendments[2], mockAmendments[3], mockAmendments[4]],
    extensions: [] as MockExtension[],
    demonstrationTypes: [],
    documents: [mockDocuments[3]],
    roles: [mockDemonstrationRoleAssignments[1]],
  },
  {
    id: "3",
    name: "Texas Reform Initiative",
    effectiveDate: new Date(2025, 0, 3),
    expirationDate: new Date(2025, 11, 3),
    description: "A reform initiative in Texas.",
    status: "On-hold",
    state: mockStates.find((state) => state.id === "TX")!,
    amendments: [] as MockAmendment[],
    extensions: [] as MockExtension[],
    demonstrationTypes: [],
    documents: [] as MockDocument[],
    roles: [mockDemonstrationRoleAssignments[0], mockDemonstrationRoleAssignments[5]],
  },
] as const satisfies MockDemonstration[];

export const mockAddDemonstrationInput: CreateDemonstrationInput = {
  name: "New Demonstration",
  description: "New Description",
  stateId: "CA",
  projectOfficerUserId: mockUsers[0].id,
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
      variables: { id: mockDemonstrations[0].id },
    },
    result: {
      data: { demonstration: mockDemonstrations[0] },
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
  {
    request: {
      query: UPDATE_DEMONSTRATION_MUTATION,
      variables: {
        id: "1",
        input: {
          name: "Updated Demo Name",
          description: "Updated description",
          effectiveDate: new Date(2025, 0, 1),
          expirationDate: new Date(2025, 11, 1),
          status: "Pre-Submission",
          stateId: STATES_AND_TERRITORIES.find((state) => state.id === "MT")!.id,
        },
      },
    },
    result: {
      data: {
        updateDemonstration: {
          ...mockDemonstrations[0],
          name: "Updated Demo Name",
          description: "Updated description",
          effectiveDate: new Date(2025, 0, 1),
          expirationDate: new Date(2025, 11, 1),
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
  // Error mock for CREATE_DEMONSTRATION_MUTATION with invalid data
  {
    request: {
      query: CREATE_DEMONSTRATION_MUTATION,
      variables: { input: { name: "bad add demonstration" } },
    },
    error: new Error("Failed to add demonstration"),
  },
];
