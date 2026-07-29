import { gql } from "graphql-tag";
import type { NonEmptyString } from "../../types";

export const emailSchema = gql`
  input CreateTestEmailInput {
    emailType: NonEmptyString!
    entityType: NonEmptyString!
    entityId: ID!
    recipientUserIds: [ID!]!
    payload: JSONObject!
  }

  type Mutation {
    createTestEmail(input: CreateTestEmailInput!): String!
      @auth(requires: ["Perform CMS Action", "Perform State Action"])
  }
`;

export interface CreateTestEmailInput {
  emailType: NonEmptyString;
  entityType: NonEmptyString;
  entityId: string;
  recipientUserIds: string[];
  payload: object;
}
