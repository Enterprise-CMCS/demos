import { User } from "demos-server";
import {
  GET_ALL_USERS,
  GET_USER_BY_ID,
  UserOption,
} from "hooks/useUserOperations";
import { HEADER_LOWER_QUERY } from "components/header/DefaultHeaderLower";
import { PROFILE_BLOCK_QUERY } from "components/header/ProfileBlock";
import { MockedResponse } from "@apollo/client/testing";
import { USER_OPTIONS_QUERY } from "queries/userQueries";

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
};
export const spongebob: Partial<User> = {
  fullName: "spongebob squarepants",
};
export const squidward: Partial<User> = {
  fullName: " squidward tentacles",
};
export const patrick: Partial<User> = {
  fullName: "patrick star",
};

export const userMocks: MockedResponse[] = [
  {
    request: {
      query: GET_ALL_USERS,
    },
    result: {
      data: { users: [spongebob, squidward, patrick] },
    },
  },
  {
    request: {
      query: GET_USER_BY_ID,
      variables: { id: "ss" },
    },
    result: {
      data: { user: spongebob },
    },
  },
  {
    request: {
      query: GET_USER_BY_ID,
      variables: { id: "ps" },
    },
    result: {
      data: { user: patrick },
    },
  },
  {
    request: {
      query: GET_USER_BY_ID,
      variables: { id: "st" },
    },
    result: {
      data: { user: squidward },
    },
  },
  {
    request: {
      query: HEADER_LOWER_QUERY,
      variables: { id: 1 },
    },
    result: {
      data: {
        user: {
          fullName: "User Testerson",
        },
      },
    },
  },
  {
    request: {
      query: PROFILE_BLOCK_QUERY,
      variables: { id: 1 },
    },
    result: {
      data: {
        user: {
          fullName: "User Testerson",
        },
      },
    },
  },
  {
    request: {
      query: HEADER_LOWER_QUERY,
      variables: { id: 2 },
    },
    result: {
      data: {
        user: {
          fullName: "John Doe",
        },
      },
    },
  },
  {
    request: {
      query: PROFILE_BLOCK_QUERY,
      variables: { id: 2 },
    },
    result: {
      data: {
        user: {
          fullName: "John Doe",
        },
      },
    },
  },
  {
    request: {
      query: USER_OPTIONS_QUERY,
    },
    result: {
      data: {
        users: [
          {
            fullName: "Yoda",
          },
          {
            fullName: "Leia Organa",
          },
          {
            fullName: "Han Solo",
          },
          {
            fullName: "Luke Skywalker",
          },
          {
            fullName: "Darth Vader",
          },
        ] satisfies UserOption[],
      },
    },
  },
];
