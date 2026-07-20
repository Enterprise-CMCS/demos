import { PersonType, User } from "demos-server";

import { MockedResponse } from "@apollo/client/testing";
import { mockPeople, MockPerson } from "./personMocks";
import { mockStates } from "./stateMocks";
import { getMockPersonType, isMockUnauthenticated } from "config/env";
import { GET_CURRENT_USER_QUERY } from "components/user/UserProvider";
import { ManagedUser, USER_MANAGEMENT_QUERY } from "pages/admin/UserManagement";

export type MockUser = Pick<User, "id" | "username"> & {
  person: MockPerson;
};

const getPrettyFirstName = (personType: PersonType): string => {
  switch (personType) {
    case "demos-admin":
      return "Admin";
    case "demos-state-user":
      return "State";
    case "demos-cms-user":
      return "CMS";
    default:
      return "Unknown";
  }
};

export const developmentMockUser: MockUser = {
  id: "999",
  username: "mock.dev.user",
  person: {
    id: "999",
    firstName: getPrettyFirstName(getMockPersonType()),
    lastName: "User",
    fullName: `${getPrettyFirstName(getMockPersonType())} User`,
    personType: getMockPersonType(),
    email: "mock.user@email.com",
    states: mockStates,
  },
};

export const mockUsers: MockUser[] = [
  { id: "1", username: "john.doe", person: mockPeople[0] },
  { id: "2", username: "jane.smith", person: mockPeople[1] },
  { id: "3", username: "jim.smith", person: mockPeople[2] },
  { id: "4", username: "darth.smith", person: mockPeople[3] },
  { id: "5", username: "bob.johnson", person: mockPeople[4] },
  { id: "6", username: "alice.brown", person: mockPeople[5] },
  { id: "7", username: "carlos.rivera", person: mockPeople[6] },
  { id: "8", username: "emily.clark", person: mockPeople[7] },
  { id: "9", username: "cara.lee", person: mockPeople[8] },
  { id: "10", username: "david.chen", person: mockPeople[9] },
];

// Covers each display case the User Management table has to handle: all-states
// roles, a state user with several states, a state user with none ("-"), and a
// user who has never logged in ("-").
const mockManagedUsers: ManagedUser[] = [
  {
    id: "1",
    lastLogin: new Date("2026-04-03T12:00:00.000Z"),
    person: { ...mockPeople[0], states: [] },
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
