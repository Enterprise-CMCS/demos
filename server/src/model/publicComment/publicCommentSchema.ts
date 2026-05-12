import { gql } from "graphql-tag";
import { Deliverable, NonEmptyString, User } from "../../types";

export const publicCommentSchema = gql`
  type DeliverableComment {
    id: ID!
    deliverable: Deliverable!
    authorUser: User!
    content: NonEmptyString!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Mutation {
    createPublicComment(deliverableId: ID!, comment: NonEmptyString): DeliverableComment
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
