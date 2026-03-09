import { gql } from "graphql-tag";

export const tagConfigurationSchema = gql`
  type Query {
    demonstrationTypeNames: [Tag!]! @auth(permissions: ["Manage Demonstration Types"])
    applicationTags: [Tag!]!
  }
`;
