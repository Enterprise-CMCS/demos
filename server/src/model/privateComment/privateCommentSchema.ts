import { gql } from "graphql-tag";

export const privateCommentSchema = gql`
  type Mutation {
    createPrivateComment(deliverableId: ID!, comment: NonEmptyString!): DeliverableComment!
  }
`;
