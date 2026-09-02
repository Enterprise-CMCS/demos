import { User } from "demos-server";
import { mockPerson } from "./personMocks";

import { MockedResponse } from "@apollo/client/testing";
import { mockPeople } from "./personMocks";
import { mockStates } from "./stateMocks";
import { isMockUnauthenticated } from "config/env";
import { GET_CURRENT_USER_QUERY } from "components/user/UserProvider";
import { ManagedUser } from "components/table/columns/UserManagementColumns";
import { USER_MANAGEMENT_QUERY } from "components/table/tables/UserManagementTable";

export const developmentMockUser: User = {
  id: "999",
  username: "mock.dev.user",
  person: mockPerson,
  cognitoSubject: "mock-cognito-subject",
  ownedDocuments: [],
  ownedDeliverables: [],
  systemRoles: [],
  permissions: [],
  lastLogin: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Common test user variants for component testing
export const readonlyMockUser: User = {
  ...developmentMockUser,
  person: { ...developmentMockUser.person, personType: "demos-restricted-cms-user" },
};

export const cmsMockUser: User = {
  ...developmentMockUser,
  person: { ...developmentMockUser.person, personType: "demos-cms-user" },
};

export const mockUsers: User[] = [
  { ...developmentMockUser, id: "1", username: "john.doe" },
  { ...developmentMockUser, id: "2", username: "jane.smith" },
  { ...developmentMockUser, id: "3", username: "jim.smith" },
  { ...developmentMockUser, id: "4", username: "darth.smith" },
  { ...developmentMockUser, id: "5", username: "bob.johnson" },
  { ...developmentMockUser, id: "6", username: "alice.brown" },
  { ...developmentMockUser, id: "7", username: "carlos.rivera" },
  { ...developmentMockUser, id: "8", username: "emily.clark" },
  { ...developmentMockUser, id: "9", username: "cara.lee" },
  { ...developmentMockUser, id: "10", username: "david.chen" },
];

// Covers each display case: all-states, multi-state, no states, never logged in.
const mockManagedUsers: ManagedUser[] = [
  {
    id: "1",
    lastLogin: new Date("2026-04-03T12:00:00.000Z"),
    person: { ...mockPeople[0], personType: "demos-cms-user", states: [] },
  },
  {
    id: "2",
    lastLogin: new Date("2026-03-11T12:00:00.000Z"),
    person: { ...mockPeople[1], personType: "demos-admin", states: [] },
  },
  {
    id: "3",
    lastLogin: new Date("2026-02-28T12:00:00.000Z"),
    person: {
      ...mockPeople[2],
      personType: "demos-state-user",
      states: [mockStates[0], mockStates[1]],
    },
  },
  {
    id: "4",
    lastLogin: new Date("2026-03-22T12:00:00.000Z"),
    person: { ...mockPeople[3], personType: "demos-state-user", states: [] },
  },
  {
    id: "5",
    lastLogin: null,
    person: { ...mockPeople[4], personType: "demos-state-user", states: [] },
  },
];

const mockUserManagementResponse: MockedResponse = {
  request: { query: USER_MANAGEMENT_QUERY },
  result: { data: { users: mockManagedUsers } },
  maxUsageCount: Number.POSITIVE_INFINITY,
};

const mockUserFailureResponse: MockedResponse = {
  request: { query: GET_CURRENT_USER_QUERY },
  error: new Error("Mock authentication failure"),
  maxUsageCount: Number.POSITIVE_INFINITY,
};

const mockUserSuccessResponse: MockedResponse = {
  request: { query: GET_CURRENT_USER_QUERY },
  result: { data: { currentUser: developmentMockUser } },
  maxUsageCount: Number.POSITIVE_INFINITY,
};

export const userMocks: MockedResponse[] = isMockUnauthenticated()
  ? [mockUserFailureResponse]
  : [mockUserSuccessResponse, mockUserManagementResponse];
