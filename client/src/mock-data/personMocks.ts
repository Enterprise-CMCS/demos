import { MockedResponse } from "@apollo/client/testing";
import { GET_USER_SELECT_OPTIONS_QUERY } from "components/input/select/SelectUsers";
import { Person } from "demos-server";
import { MockState, mockStates } from "./stateMocks";

export type MockPerson = Pick<
  Person,
  "id" | "firstName" | "lastName" | "personType" | "email"
> & {
  states: MockState[];
};

export const mockPeople: MockPerson[] = [
  {
    id: "1",
    firstName: "John",
    lastName: "Doe",
    personType: "demos-cms-user",
    email: "john.doe@email.com",
    states: [mockStates[0]],
  },
  {
    id: "2",
    firstName: "Jane",
    lastName: "Smith",
    personType: "demos-cms-user",
    email: "jane.smith@email.com",
    states: [mockStates[1]],
  },
  {
    id: "3",
    firstName: "Jim",
    lastName: "Smith",
    personType: "demos-cms-user",
    email: "jane.smith@email.com",
    states: [mockStates[2]],
  },
  {
    id: "4",
    firstName: "Darth",
    lastName: "Smith",
    personType: "demos-cms-user",
    email: "darth.smith@email.com",
    states: [mockStates[3]],
  },
  {
    id: "5",
    firstName: "Bob",
    lastName: "Johnson",
    personType: "demos-cms-user",
    email: "bob.johnson@email.com",
    states: [mockStates[4]],
  },
  {
    id: "6",
    firstName: "Alice",
    lastName: "Brown",
    personType: "demos-cms-user",
    email: "alice.brown@email.com",
    states: [mockStates[5]],
  },
  {
    id: "7",
    firstName: "Carlos",
    lastName: "Rivera",
    personType: "demos-cms-user",
    email: "carlos.rivera@email.com",
    states: [mockStates[6]],
  },
  {
    id: "8",
    firstName: "Emily",
    lastName: "Clark",
    personType: "demos-cms-user",
    email: "emily.clark@email.com",
    states: [mockStates[7]],
  },
  {
    id: "9",
    firstName: "Cara",
    lastName: "Lee",
    personType: "demos-cms-user",
    email: "cara.lee@email.com",
    states: [mockStates[8]],
  },
  {
    id: "10",
    firstName: "David",
    lastName: "Chen",
    personType: "demos-cms-user",
    email: "david.chen@email.com",
    states: [mockStates[9]],
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
