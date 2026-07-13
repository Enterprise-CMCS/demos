import { gql } from "graphql-tag";
import type { NonEmptyString } from "../../types";

export const emailSchema = gql`
  input CreateEmailInput {
    emailType: NonEmptyString!
    entityType: NonEmptyString!
    entityId: ID!
    payload: JSONObject!
  }

  type Mutation {
    createEmail(input: CreateEmailInput!): String!
      @auth(requires: ["Perform CMS Action", "Perform State Action"])
  }
`;

export interface CreateEmailInput {
  emailType: NonEmptyString;
  entityType: NonEmptyString;
  entityId: string;
  payload: object;
}
