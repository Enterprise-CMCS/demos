import { User } from "demos-server";
import { GET_ALL_USERS, GET_USER_BY_ID } from "hooks/useUserOperations";
import { GET_CURRENT_USER_QUERY } from "hooks/useCurrentUser";

import { MockedResponse } from "@apollo/client/testing";

export const johnDoe: User = {
  id: "1",
  fullName: "John Doe",
  cognitoSubject: "1234567890",
  username: "johndoe",
  email: "johndoe@example.com",
  displayName: "John",
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
  roles: [],
  states: [],
  demonstrations: [],
  events: [],
  ownedDocuments: [],
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
      roles: [],
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
];
