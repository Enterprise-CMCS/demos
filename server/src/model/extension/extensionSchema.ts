import { gql } from "graphql-tag";

export const extensionSchema = gql`
  type Extension {
    id: ID!
    title: String!
    state: String!
    projectOfficerId: String!
    effectiveDate: DateTime
    expirationDate: DateTime
    description: String
    demonstrationId: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CreateExtensionInput {
    title: String!
    state: String!
    projectOfficerId: String!
    effectiveDate: DateTime
    expirationDate: DateTime
    description: String
    demonstrationId: String!
  }

  extend type Mutation {
    createExtension(input: CreateExtensionInput!): Extension!
  }
`;
