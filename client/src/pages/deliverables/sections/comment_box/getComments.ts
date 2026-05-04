import { PersonType } from "demos-server";
import { CommentBoxComment } from "./Comment";

// TODO: Replace with actual API calls
export const getPublicComments = (): CommentBoxComment[] => [
  {
    commentText: "This is a public comment.",
    userFullName: "Jane Doe",
    timestamp: new Date("2026-04-01T10:00:00"),
    commentVisibility: "public",
  },
];

export const getPrivateComments = (): CommentBoxComment[] => [
  {
    commentText: "This is a private comment.",
    userFullName: "John Smith",
    timestamp: new Date("2026-04-02T09:00:00"),
    commentVisibility: "private",
  },
];

export const getComments = (personType: PersonType): CommentBoxComment[] => {
  const isStateUser = personType === "demos-state-user";
  return [...getPublicComments(), ...(isStateUser ? [] : getPrivateComments())];
};
