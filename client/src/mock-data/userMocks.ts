import { User } from "demos-server";
import { GET_CURRENT_USER_QUERY } from "hooks/useCurrentUser";
import { GET_ALL_USERS, GET_USER_BY_ID } from "hooks/useUserOperations";

export type MockUser = Pick<User, "id" | "fullName"> & { __typename: "User" };

export const mockUsers: MockUser[] = [
  { __typename: "User", id: "1", fullName: "John Doe" },
  { __typename: "User", id: "2", fullName: "Jane Smith" },
  { __typename: "User", id: "3", fullName: "Jim Smith" },
  { __typename: "User", id: "4", fullName: "Darth Smith" },
  { __typename: "User", id: "5", fullName: "Bob Johnson" },
  { __typename: "User", id: "6", fullName: "Alice Brown" },
  { __typename: "User", id: "7", fullName: "Carlos Rivera" },
  { __typename: "User", id: "8", fullName: "Emily Clark" },
  { __typename: "User", id: "9", fullName: "Cara Lee" },
  { __typename: "User", id: "10", fullName: "David Chen" },
];

import { MockedResponse } from "@apollo/client/testing";
import { GET_USER_SELECT_OPTIONS_QUERY } from "components/input/select/SelectUsers";

export const johnDoe: User & { __typename: "User" } = {
  __typename: "User",
  id: "JohnDoe",
  personTypeId: "demos-cms-user",
  fullName: "John Doe",
  cognitoSubject: "1234567890",
  username: "johndoe",
  email: "johndoe@example.com",
  displayName: "John",
  events: [],
  ownedDocuments: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  roles: ["All Users"],
};

export const userOptions: Pick<User, "fullName">[] = [
  { fullName: "John Doe" },
  { fullName: "Jane Smith" },
  { fullName: "Jim Smith" },
  { fullName: "Darth Smith" },
  { fullName: "Bob Johnson" },
  { fullName: "Alice Brown" },
  { fullName: "Carlos Rivera" },
  { fullName: "Emily Clark" },
  { fullName: "Samantha Lee" },
  { fullName: "Michael Chen" },
  { fullName: "Linda Park" },
  { fullName: "David Kim" },
  { fullName: "Olivia Turner" },
  { fullName: "Henry Adams" },
  { fullName: "Sophia Martinez" },
  { fullName: "James Lee" },
];

export const spongebob: Partial<User> = { fullName: "spongebob squarepants" };
export const squidward: Partial<User> = { fullName: " squidward tentacles" };
export const patrick: Partial<User> = { fullName: "patrick star" };

export const bypassUserGUID = "00000000-1111-2222-3333-123abc123abc";

const currentUserResult = {
  data: {
    currentUser: {
      __typename: "User",
      id: bypassUserGUID,
      cognitoSubject: "fake-sub-1",
      username: "johndoe",
      email: "johndoe@example.com",
      fullName: "John Doe",
      displayName: "John",
      personTypeId: "demos-cms-user",
    },
  },
};

export const userMocks: MockedResponse[] = [
  // It takes two of these apparently to hydrate the Profile block. If load it refetches.
  // TODO: figure out why refetch is so eager.
  { request: { query: GET_CURRENT_USER_QUERY }, result: currentUserResult },
  { request: { query: GET_CURRENT_USER_QUERY }, result: currentUserResult },

  {
    request: { query: GET_ALL_USERS },
    result: { data: { users: [spongebob, squidward, patrick] } },
  },
  {
    request: { query: GET_USER_BY_ID, variables: { id: "ss" } },
    result: { data: { user: spongebob } },
  },
  {
    request: { query: GET_USER_BY_ID, variables: { id: "ps" } },
    result: { data: { user: patrick } },
  },
  {
    request: { query: GET_USER_BY_ID, variables: { id: "st" } },
    result: { data: { user: squidward } },
  },
  {
    request: { query: GET_USER_SELECT_OPTIONS_QUERY },
    result: { data: { users: mockUsers } },
  },
];
