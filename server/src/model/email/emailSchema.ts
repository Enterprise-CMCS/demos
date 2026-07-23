import { gql } from "graphql-tag";
import type { NonEmptyString } from "../../types";

export const emailSchema = gql`
  input TestEmailInput {
    emailType: NonEmptyString!
    entityType: NonEmptyString!
    entityId: ID!
    recipientUserIds: [ID!]!
    payload: JSONObject!
  }

  type Mutation {
    testEmail(input: TestEmailInput!): String!
      @auth(requires: ["Perform CMS Action", "Perform State Action"])
  }
`;

export interface TestEmailInput {
  emailType: NonEmptyString;
  entityType: NonEmptyString;
  entityId: string;
  recipientUserIds: string[];
  payload: object;
}
