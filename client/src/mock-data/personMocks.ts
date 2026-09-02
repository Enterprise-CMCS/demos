import { MockedResponse } from "@apollo/client/testing";
import { GET_USER_SELECT_OPTIONS_QUERY } from "components/input/select/SelectUsers";
import { Person, PersonType } from "demos-server";
import { getMockPersonType } from "config/env";
import { mockStates } from "./stateMocks";

const getPrettyFirstName = (personType: PersonType): string => {
  switch (personType) {
    case "demos-admin":
      return "Admin";
    case "demos-state-user":
      return "State";
    case "demos-cms-user":
      return "CMS";
    case "demos-restricted-cms-user":
      return "Readonly";
    default:
      return "Unknown";
  }
};

export const mockPerson: Person = {
  id: "999",
  firstName: getPrettyFirstName(getMockPersonType()),
  lastName: "User",
  fullName: `${getPrettyFirstName(getMockPersonType())} User`,
  personType: getMockPersonType(),
  email: "mock.user@email.com",
  states: mockStates,
  roles: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockPeople: Person[] = [
  {
    ...mockPerson,
    id: "1",
    firstName: "John",
    lastName: "Doe",
    fullName: "John Doe",
    email: "john.doe@email.com",
    states: [mockStates[0]],
  },
  {
    ...mockPerson,
    id: "2",
    firstName: "Jane",
    lastName: "Smith",
    fullName: "Jane Smith",
    email: "jane.smith@email.com",
    states: [mockStates[1]],
  },
  {
    ...mockPerson,
    id: "3",
    firstName: "Jim",
    lastName: "Smith",
    fullName: "Jim Smith",
    email: "jim.smith@email.com",
    states: [mockStates[2]],
  },
  {
    ...mockPerson,
    id: "4",
    firstName: "Darth",
    lastName: "Smith",
    fullName: "Darth Smith",
    email: "darth.smith@email.com",
  },
  {
    ...mockPerson,
    id: "5",
    firstName: "Frank",
    lastName: "Wilson",
    fullName: "Frank Wilson",
    email: "frank.wilson@email.com",
  },
];

export const personMocks: MockedResponse[] = [
  {
    request: {
      query: GET_USER_SELECT_OPTIONS_QUERY,
    },
    result: {
      data: {
        people: mockPeople,
      },
    },
  },
];
