import { CreateDemonstrationInput, Demonstration } from "demos-server";
import {
  ADD_DEMONSTRATION_QUERY,
  GET_ALL_DEMONSTRATIONS_QUERY,
  GET_DEMONSTRATION_BY_ID_QUERY,
  UPDATE_DEMONSTRATION_MUTATION,
} from "queries/demonstrationQueries";

import { DEMONSTRATION_DETAIL_QUERY } from "pages/DemonstrationDetail/DemonstrationDetail";
import { DEMONSTRATIONS_PAGE_QUERY } from "pages/Demonstrations";

import { MockedResponse } from "@apollo/client/testing";

import { MockDemonstrationStatus, mockDemonstrationStatuses } from "./demonstrationStatusMocks";
import { MockState, mockStates } from "./stateMocks";
import { MockUser, mockUsers } from "./userMocks";
import { MockAmendment, mockAmendments } from "./amendmentMocks";
import { MockExtension, mockExtensions } from "./extensionMocks";
import { MockContact, mockContacts } from "./contactMocks";
import { MockDocument, mockDocuments } from "./documentMocks";

export type MockDemonstration = Pick<
  Demonstration,
  "id" | "name" | "description" | "effectiveDate" | "expirationDate"
> & {
  demonstrationStatus: MockDemonstrationStatus;
  state: MockState;
  projectOfficer: MockUser;
  users: MockUser[];
  amendments: MockAmendment[];
  extensions: MockExtension[];
  contacts: MockContact[];
  demonstrationTypes: Array<object>;
  documents: MockDocument[];
};

export const mockDemonstrations: MockDemonstration[] = [
  {
    id: "1",
    name: "Montana Medicaid Waiver",
    demonstrationStatus: mockDemonstrationStatuses[1],
    state: mockStates.find((state) => state.id === "MT")!,
    description: "A demonstration project in Montana.",
    effectiveDate: new Date("2025-01-01"),
    expirationDate: new Date("2025-12-01"),
    projectOfficer: mockUsers[0],
    users: [mockUsers[0]],
    amendments: [mockAmendments[0], mockAmendments[1]],
    extensions: [mockExtensions[0]],
    contacts: [mockContacts[0], mockContacts[1], mockContacts[2]],
    demonstrationTypes: [],
    documents: [mockDocuments[0], mockDocuments[1], mockDocuments[2]],
  },
  {
    id: "2",
    name: "Florida Health Innovation",
    demonstrationStatus: mockDemonstrationStatuses[5],
    effectiveDate: new Date("2025-02-02"),
    expirationDate: new Date("2025-12-02"),
    description: "A health innovation project in Florida.",
    state: mockStates.find((state) => state.id === "FL")!,
    projectOfficer: mockUsers[1],
    users: [mockUsers[1]],
    amendments: [mockAmendments[2], mockAmendments[3], mockAmendments[4]],
    extensions: [],
    contacts: [mockContacts[1], mockContacts[3]],
    demonstrationTypes: [],
    documents: [mockDocuments[3]],
  },
  {
    id: "3",
    name: "Texas Reform Initiative",
    effectiveDate: new Date("2025-03-03"),
    expirationDate: new Date("2025-12-03"),
    demonstrationStatus: mockDemonstrationStatuses[6],
    description: "A reform initiative in Texas.",
    state: mockStates.find((state) => state.id === "TX")!,
    projectOfficer: mockUsers[4],
    users: [mockUsers[0]],
    amendments: [],
    extensions: [],
    contacts: [mockContacts[1], mockContacts[4]],
    demonstrationTypes: [],
    documents: [],
  },
];

export const mockAddDemonstrationInput: CreateDemonstrationInput = {
  name: "New Demonstration",
  description: "New Description",
  effectiveDate: new Date("2025-01-01"),
  expirationDate: new Date("2025-12-31"),
  demonstrationStatusId: mockDemonstrationStatuses[0].id,
  stateId: "CA",
  userIds: [mockUsers[0].id],
  projectOfficerUserId: mockUsers[0].id,
};

export const demonstrationMocks: MockedResponse[] = [
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
  {
    request: {
      query: DEMONSTRATIONS_PAGE_QUERY,
    },
    result: {
      data: {
        demonstrations: mockDemonstrations,
        projectOfficerOptions: mockUsers,
        stateOptions: mockStates,
        statusOptions: mockDemonstrationStatuses,
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
        demonstration: (() => {
          const demo = mockDemonstrations[0];
          return {
            ...demo,
            amendments: demo.amendments.map((a) => ({
              ...a,
              status: a.amendmentStatus,
              amendmentStatus: undefined,
            })),
            extensions: demo.extensions.map((e) => ({
              ...e,
              status: e.extensionStatus,
              extensionStatus: undefined,
            })),
          };
        })(),
      },
    },
  },
  {
    request: {
      query: ADD_DEMONSTRATION_QUERY,
      variables: { input: mockAddDemonstrationInput },
    },
    result: {
      data: { addDemonstration: mockDemonstrations[0] },
    },
  },

  {
    request: {
      query: ADD_DEMONSTRATION_QUERY,
      variables: { input: { name: "bad add demonstration" } },
    },
    error: new Error("Failed to add demonstration"),
  },

  {
    request: {
      query: UPDATE_DEMONSTRATION_MUTATION,
      variables: {
        id: "1",
        input: {
          name: "Updated Demo Name",
          description: "Updated description",
          effectiveDate: new Date("2024-07-01T00:00:00.000Z"),
          expirationDate: new Date("2024-07-31T00:00:00.000Z"),
          demonstrationStatusId: "1",
          stateId: "1",
          userIds: ["1"],
          projectOfficerUserId: "1",
        },
      },
    },
    result: {
      data: {
        updateDemonstration: {
          ...mockDemonstrations[0],
          name: "Updated Demo Name",
          description: "Updated description",
          effectiveDate: new Date("2024-07-01T00:00:00.000Z"),
          expirationDate: new Date("2024-07-31T00:00:00.000Z"),
          updatedAt: new Date("2024-07-01T00:00:00.000Z"),
        },
      },
    },
  },
];
