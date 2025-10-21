import { User } from "demos-server";

export type MockUser = Pick<User, "id" | "username"> & {
  person: MockPerson;
};
import { MockedResponse } from "@apollo/client/testing";
import { GET_CURRENT_USER_QUERY } from "components/user/UserContext";
import { mockPeople, MockPerson } from "./personMocks";
import { mockStates } from "./stateMocks";

const developmentMockUser: MockUser = {
  id: "999",
  username: "mock.dev.user",
  person: {
    id: "999",
    firstName: "Mock",
    lastName: "User",
    fullName: "Mock User",
    personType: "demos-cms-user",
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

export const userMocks: MockedResponse[] = [
  {
    request: {
      query: GET_CURRENT_USER_QUERY,
    },
    result: {
      data: { currentUser: developmentMockUser },
    },
  },
  {
    request: {
      query: GET_CURRENT_USER_QUERY,
    },
    result: {
      data: { currentUser: mockUsers[0] },
    },
  },
];
