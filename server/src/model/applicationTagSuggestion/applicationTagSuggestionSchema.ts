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
      @auth(requires: "Access CMS-Only Mutations")
    replaceApplicationTagSuggestion(
      applicationId: ID!
      value: String!
      newValue: String!
    ): Application @auth(requires: "Access CMS-Only Mutations")
    removeApplicationTagSuggestion(applicationId: ID!, value: String!): ApplicationTagSuggestion
      @auth(requires: "Access CMS-Only Mutations")
  }
`;
