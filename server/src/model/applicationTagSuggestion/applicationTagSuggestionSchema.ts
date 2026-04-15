import { gql } from "graphql-tag";

export const applicationTagSuggestionSchema = gql`
  input UpdateApplicationTagSuggestionInput {
    suggestionId: ID!
    applicationId: ID!
  }

  type Mutation {
    acceptApplicationTagSuggestion(input: UpdateApplicationTagSuggestionInput!): Application
  }

  type Mutation {
    replaceApplicationTagSuggestion(input: UpdateApplicationTagSuggestionInput!): Application
  }

  type Mutation {
    removeApplicationTagSuggestion(input: UpdateApplicationTagSuggestionInput!): Application
  }
`;

export interface UpdateApplicationTagSuggestionInput {
  suggestionId: string;
  applicationId: string;
}
