import { gql } from "graphql-tag";

export const emailSchema = gql`
  type Mutation {
    createTestEmail(recipientEmail: NonEmptyString!): String!
      @auth(requires: ["Perform Admin Action"])
  }
`;
