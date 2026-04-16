import { gql } from "graphql-tag";

export const applicationTagSuggestionSchema = gql`
  type ApplicationTagSuggestion {
    id: ID!
    applicationId: ID!
    value: String!
    statusId: String!
    createdAt: String!
    updatedAt: String!
  }

  type Mutation {
    acceptApplicationTagSuggestion(suggestionId: ID!): Application
    replaceApplicationTagSuggestion(suggestionId: ID!, newValue: String!): Application
    removeApplicationTagSuggestion(suggestionId: ID!): ApplicationTagSuggestion
  }
`;
