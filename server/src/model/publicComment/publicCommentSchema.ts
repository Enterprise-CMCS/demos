import { gql } from "graphql-tag";
import { Deliverable, NonEmptyString, User } from "../../types";

export const publicCommentSchema = gql`
  type DeliverableComment {
    id: ID!
    deliverable: Deliverable! @auth(requires: "Access Comment Deliverable")
    authorUser: User! @auth(requires: "Access Comment Author")
    content: NonEmptyString!
    createdAt: DateTime!
    updatedAt: DateTime!
  }
`;

export interface DeliverableComment {
  id: string;
  deliverable: Deliverable;
  authorUser: User;
  content: NonEmptyString;
  createdAt: Date;
  updatedAt: Date;
}
