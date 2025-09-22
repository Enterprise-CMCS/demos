import { CreateDemonstrationInput, Demonstration } from "demos-server";
import {
  CREATE_DEMONSTRATION_MUTATION,
  GET_ALL_DEMONSTRATIONS_QUERY,
  GET_DEMONSTRATION_BY_ID_QUERY,
  UPDATE_DEMONSTRATION_MUTATION,
} from "queries/demonstrationQueries";
import { DEMONSTRATION_DETAIL_QUERY } from "pages/DemonstrationDetail/DemonstrationDetail";
import { DEMONSTRATIONS_PAGE_QUERY } from "pages/DemonstrationsPage";
import { MockedResponse } from "@apollo/client/testing";
import { MockState, mockStates } from "./stateMocks";
import { MockUser, mockUsers } from "./userMocks";
import { MockAmendment, mockAmendments } from "./amendmentMocks";
import { MockExtension, mockExtensions } from "./extensionMocks";
import { MockContact, mockContacts } from "./contactMocks";
import { MockDocument, mockDocuments } from "./documentMocks";
import { GET_DEMONSTRATION_OPTIONS_QUERY } from "hooks/useDemonstrationOptions";
import { DEMONSTRATION_STATUSES } from "demos-server-constants";
import type { DemonstrationStatus } from "demos-server";

const demonstrationStatuses: Pick<DemonstrationStatus, "id" | "name">[] =
  DEMONSTRATION_STATUSES.map((s) => ({ id: s.id, name: s.name }));

export type MockDemonstration = Pick<
  Demonstration,
  "id" | "name" | "description" | "effectiveDate" | "expirationDate"
> & {
  demonstrationStatus: Pick<DemonstrationStatus, "id" | "name">;
  state: MockState;
  projectOfficer: MockUser;
  amendments: MockAmendment[];
  extensions: MockExtension[];
  contacts: MockContact[];
  demonstrationTypes: Array<object>;
  documents: MockDocument[];
};

export const mockDemonstrations = [
  {
    id: "1",
    name: "Montana Medicaid Waiver",
    description: "A demonstration project in Montana.",
    effectiveDate: new Date(2025, 0, 1),
    expirationDate: new Date(2025, 11, 1),
    projectOfficer: mockUsers[0],
    demonstrationStatus: demonstrationStatuses.find((s) => s.name === "Approved")!,
    state: mockStates.find((state) => state.id === "MT")!,
    amendments: [mockAmendments[0], mockAmendments[1], mockAmendments[5]],
    extensions: [mockExtensions[0], mockExtensions[1], mockExtensions[2]],
    contacts: [mockContacts[0], mockContacts[1], mockContacts[2]],
    demonstrationTypes: [],
    documents: [mockDocuments[0], mockDocuments[1], mockDocuments[2]],
  },
  {
    id: "2",
    name: "Florida Health Innovation",
    description: "A health innovation project in Florida.",
    effectiveDate: new Date(2025, 0, 2),
    expirationDate: new Date(2025, 11, 2),
    demonstrationStatus: demonstrationStatuses.find((s) => s.name === "Pre-Submission")!,
    state: mockStates.find((state) => state.id === "FL")!,
    projectOfficer: mockUsers[1],
    amendments: [mockAmendments[2], mockAmendments[3], mockAmendments[4]],
    extensions: [] as MockExtension[],
    contacts: [mockContacts[1], mockContacts[2]],
    demonstrationTypes: [],
    documents: [mockDocuments[3]],
  },
  {
    id: "3",
    name: "Texas Reform Initiative",
    effectiveDate: new Date(2025, 0, 3),
    expirationDate: new Date(2025, 11, 3),
    description: "A reform initiative in Texas.",
    demonstrationStatus: demonstrationStatuses.find((s) => s.name === "On-hold")!,
    state: mockStates.find((state) => state.id === "TX")!,
    projectOfficer: mockUsers[0],
    amendments: [] as MockAmendment[],
    extensions: [] as MockExtension[],
    contacts: [mockContacts[1], mockContacts[2]],
    demonstrationTypes: [],
    documents: [] as MockDocument[],
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
        projectOfficerOptions: mockUsers,
        stateOptions: mockStates,
        statusOptions: demonstrationStatuses,
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
          const newDemo = {
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
          return newDemo;
        })(),
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
        demonstration: (() => {
          const demo = mockDemonstrations[1];
          const newDemo = {
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
          return newDemo;
        })(),
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
        demonstration: (() => {
          const demo = mockDemonstrations[2];
          const newDemo = {
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
          return newDemo;
        })(),
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
          demonstrationStatusId: "1",
          stateId: "1",
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
  // Error mock for ADD_DEMONSTRATION_MUTATION with invalid data
  {
    request: {
      query: CREATE_DEMONSTRATION_MUTATION,
      variables: { input: { name: "bad add demonstration" } },
    },
    error: new Error("Failed to add demonstration"),
  },
];
