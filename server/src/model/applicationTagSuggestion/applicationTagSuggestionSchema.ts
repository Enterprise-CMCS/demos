import { gql } from "graphql-tag";

export const applicationTagSuggestionSchema = gql`
  type ApplicationTagSuggestion {
    applicationId: ID!
    value: String!
    statusId: String!
    createdAt: String!
    updatedAt: String!
  }

  type Mutation {
    acceptApplicationTagSuggestion(applicationId: ID!, value: String!): Application
    replaceApplicationTagSuggestion(
      applicationId: ID!
      value: String!
      newValue: String!
    ): Application
    removeApplicationTagSuggestion(applicationId: ID!, value: String!): ApplicationTagSuggestion
  }
`;
