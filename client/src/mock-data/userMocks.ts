import { User } from "demos-server";
import { GET_ALL_USERS, GET_USER_BY_ID } from "hooks/useUserOperations";
import { HEADER_LOWER_QUERY } from "components/header/HeaderLower";
import { PROFILE_BLOCK_QUERY } from "components/header/ProfileBlock";

export const spongebob: Partial<User> = {
  fullName: "spongebob squarepants",
};
export const squidward: Partial<User> = {
  fullName: " squidward tentacles",
};
export const patrick: Partial<User> = {
  fullName: "patrick star",
};

export const userMocks = [
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
];
