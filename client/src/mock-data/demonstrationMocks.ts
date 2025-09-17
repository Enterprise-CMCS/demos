import { CreateDemonstrationInput, Demonstration } from "demos-server";
import {
  CREATE_DEMONSTRATION_MUTATION,
  GET_ALL_DEMONSTRATIONS_QUERY,
  GET_DEMONSTRATION_BY_ID_QUERY,
  UPDATE_DEMONSTRATION_MUTATION,
} from "queries/demonstrationQueries";
import { DEMONSTRATION_DETAIL_QUERY } from "pages/DemonstrationDetail/DemonstrationDetail";
import { DEMONSTRATIONS_PAGE_QUERY } from "pages/Demonstrations";
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
import { EXTENSIONS_TABLE_QUERY } from "components/table/tables/ExtensionsTable";
import { AMENDMENTS_TABLE_QUERY } from "components/table/tables/AmendmentsTable";
import { DEMONSTRATION_SUMMARY_DETAILS_QUERY } from "components/table/tables/SummaryDetailsTable";
import { APPLICATION_WORKFLOW_QUERY } from "components/application/ApplicationWorkflow";
import { DOCUMENT_TABLE_QUERY } from "components/table/tables/DocumentTable";
import { CONTACTS_TABLE_QUERY } from "components/table/tables/ContactsTable";
import { DEMONSTRATION_TAB_QUERY } from "pages/DemonstrationDetail/DemonstrationTab";
import { DEMONSTRATION_DETAIL_HEADER_QUERY } from "pages/DemonstrationDetail/DemonstrationDetailHeader";

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
  __typename: "Demonstration";
};

export const mockDemonstrations = [
  {
    __typename: "Demonstration",
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
    __typename: "Demonstration",
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
    __typename: "Demonstration",
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
      query: AMENDMENTS_TABLE_QUERY,
    },
    variableMatcher: (variables: { demonstrationId: (typeof mockDemonstrations)[number]["id"] }) =>
      mockDemonstrations.map((demo) => demo.id).includes(variables.demonstrationId),
    result: (variables: { demonstrationId: (typeof mockDemonstrations)[number]["id"] }) => {
      return {
        data: {
          demonstration: mockDemonstrations.find((demo) => demo.id === variables.demonstrationId)!,
        },
      };
    },
  },
  {
    request: {
      query: EXTENSIONS_TABLE_QUERY,
    },
    variableMatcher: (variables: { demonstrationId: (typeof mockDemonstrations)[number]["id"] }) =>
      mockDemonstrations.map((demo) => demo.id).includes(variables.demonstrationId),
    result: (variables: { demonstrationId: (typeof mockDemonstrations)[number]["id"] }) => {
      return {
        data: {
          demonstration: mockDemonstrations.find((demo) => demo.id === variables.demonstrationId)!,
        },
      };
    },
  },
  {
    request: {
      query: DEMONSTRATION_SUMMARY_DETAILS_QUERY,
    },
    variableMatcher: (variables: { demonstrationId: (typeof mockDemonstrations)[number]["id"] }) =>
      mockDemonstrations.map((demo) => demo.id).includes(variables.demonstrationId),
    result: (variables: { demonstrationId: (typeof mockDemonstrations)[number]["id"] }) => {
      return {
        data: {
          demonstration: mockDemonstrations.find((demo) => demo.id === variables.demonstrationId)!,
        },
      };
    },
  },
  {
    request: {
      query: APPLICATION_WORKFLOW_QUERY,
    },
    variableMatcher: (variables: { demonstrationId: (typeof mockDemonstrations)[number]["id"] }) =>
      mockDemonstrations.map((demo) => demo.id).includes(variables.demonstrationId),
    result: (variables: { demonstrationId: (typeof mockDemonstrations)[number]["id"] }) => {
      return {
        data: {
          demonstration: mockDemonstrations.find((demo) => demo.id === variables.demonstrationId)!,
        },
      };
    },
  },
  {
    request: {
      query: DOCUMENT_TABLE_QUERY,
    },
    variableMatcher: (variables: { demonstrationId: (typeof mockDemonstrations)[number]["id"] }) =>
      mockDemonstrations.map((demo) => demo.id).includes(variables.demonstrationId),
    result: (variables: { demonstrationId: (typeof mockDemonstrations)[number]["id"] }) => {
      return {
        data: {
          demonstration: mockDemonstrations.find((demo) => demo.id === variables.demonstrationId)!,
        },
      };
    },
  },
  {
    request: {
      query: CONTACTS_TABLE_QUERY,
    },
    variableMatcher: (variables: { demonstrationId: (typeof mockDemonstrations)[number]["id"] }) =>
      mockDemonstrations.map((demo) => demo.id).includes(variables.demonstrationId),
    result: (variables: { demonstrationId: (typeof mockDemonstrations)[number]["id"] }) => {
      return {
        data: {
          demonstration: mockDemonstrations.find((demo) => demo.id === variables.demonstrationId)!,
        },
      };
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
      query: DEMONSTRATION_DETAIL_QUERY,
    },
    variableMatcher: (variables: { demonstrationId: (typeof mockDemonstrations)[number]["id"] }) =>
      mockDemonstrations.map((demo) => demo.id).includes(variables.demonstrationId),
    result: (variables: { demonstrationId: (typeof mockDemonstrations)[number]["id"] }) => {
      return {
        data: {
          demonstration: mockDemonstrations.find((demo) => demo.id === variables.demonstrationId)!,
        },
      };
    },
  },
  {
    request: {
      query: DEMONSTRATION_DETAIL_HEADER_QUERY,
    },
    variableMatcher: (variables: { demonstrationId: (typeof mockDemonstrations)[number]["id"] }) =>
      mockDemonstrations.map((demo) => demo.id).includes(variables.demonstrationId),
    result: (variables: { demonstrationId: (typeof mockDemonstrations)[number]["id"] }) => {
      return {
        data: {
          demonstration: mockDemonstrations.find((demo) => demo.id === variables.demonstrationId)!,
        },
      };
    },
  },
  {
    request: {
      query: DEMONSTRATION_TAB_QUERY,
    },
    variableMatcher: (variables: { demonstrationId: (typeof mockDemonstrations)[number]["id"] }) =>
      mockDemonstrations.map((demo) => demo.id).includes(variables.demonstrationId),
    result: (variables: { demonstrationId: (typeof mockDemonstrations)[number]["id"] }) => {
      return {
        data: {
          demonstration: mockDemonstrations.find((demo) => demo.id === variables.demonstrationId)!,
        },
      };
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
