import { MockedResponse } from "@apollo/client/testing";
import { GET_USER_SELECT_OPTIONS_QUERY } from "components/input/select/SelectUsers";
import { Person } from "demos-server";
import { MockState, mockStates } from "./stateMocks";

export type MockPerson = Pick<
  Person,
  "id" | "fullName" | "personType" | "displayName" | "email"
> & {
  states: MockState[];
};

export const mockPeople: MockPerson[] = [
  {
    id: "1",
    fullName: "John Doe",
    personType: "demos-cms-user",
    displayName: "john.doe",
    email: "john.doe@email.com",
    states: [mockStates[0]],
  },
  {
    id: "2",
    fullName: "Jane Smith",
    personType: "demos-cms-user",
    displayName: "jane.smith",
    email: "jane.smith@email.com",
    states: [mockStates[1]],
  },
  {
    id: "3",
    fullName: "Jim Smith",
    personType: "demos-cms-user",
    displayName: "jane.smith",
    email: "jane.smith@email.com",
    states: [mockStates[2]],
  },
  {
    id: "4",
    fullName: "Darth Smith",
    personType: "demos-cms-user",
    displayName: "darth.smith",
    email: "darth.smith@email.com",
    states: [mockStates[3]],
  },
  {
    id: "5",
    fullName: "Bob Johnson",
    personType: "demos-cms-user",
    displayName: "bob.johnson",
    email: "bob.johnson@email.com",
    states: [mockStates[4]],
  },
  {
    id: "6",
    fullName: "Alice Brown",
    personType: "demos-cms-user",
    displayName: "alice.brown",
    email: "alice.brown@email.com",
    states: [mockStates[5]],
  },
  {
    id: "7",
    fullName: "Carlos Rivera",
    personType: "demos-cms-user",
    displayName: "carlos.rivera",
    email: "carlos.rivera@email.com",
    states: [mockStates[6]],
  },
  {
    id: "8",
    fullName: "Emily Clark",
    personType: "demos-cms-user",
    displayName: "emily.clark",
    email: "emily.clark@email.com",
    states: [mockStates[7]],
  },
  {
    id: "9",
    fullName: "Cara Lee",
    personType: "demos-cms-user",
    displayName: "cara.lee",
    email: "cara.lee@email.com",
    states: [mockStates[8]],
  },
  {
    id: "10",
    fullName: "David Chen",
    personType: "demos-cms-user",
    displayName: "david.chen",
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
