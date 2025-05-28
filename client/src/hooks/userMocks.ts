import { User } from "models/index";
import { GET_ALL_USERS, GET_USER_BY_ID } from "./useUserOperations";

export const spongebob: Partial<User> = { firstName: "spongebob", lastName: "squarepants" };
export const squidward: Partial<User> = { firstName: " squidward", lastName: "tentacles" };
export const patrick: Partial<User> = { firstName: "patrick", lastName: "star" };

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
];
