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
    acceptApplicationTagSuggestion(applicationId: ID!, value: String!): Application!
      @auth(requires: ["Modify Applications"])
    replaceApplicationTagSuggestion(
      applicationId: ID!
      value: String!
      newValue: String!
    ): Application! @auth(requires: ["Modify Applications"])
    removeApplicationTagSuggestion(applicationId: ID!, value: String!): ApplicationTagSuggestion!
      @auth(requires: ["Modify Applications"])
  }
`;
