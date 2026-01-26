import { gql } from "graphql-tag";

export const tagConfigurationSchema = gql`
  type Query {
    demonstrationTypeNames: [Tag!]!
    applicationTags: [Tag!]!
  }
`;
