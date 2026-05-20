import { gql } from "graphql-tag";
import type { TagName } from "../../types.js";

export const applicationTagSuggestionSchema = gql`
  type SuggestedApplicationTagSource {
    documentId: ID!
    documentName: String!
    startPageNo: Int!
    endPageNo: Int!
    textStartIndex: Int!
    textEndIndex: Int!
    textLength: Int!
    confidence: Float!
  }

  type SuggestedApplicationTag {
    tagName: TagName!
    sources: [SuggestedApplicationTagSource!]!
  }

  type ApplicationTagSuggestion {
    applicationId: ID!
    value: String!
    statusId: String!
    createdAt: String!
    updatedAt: String!
  }

  type Mutation {
    acceptApplicationTagSuggestion(applicationId: ID!, value: String!): Application
      @auth(requires: ["Perform CMS Action"])
    replaceApplicationTagSuggestion(
      applicationId: ID!
      value: String!
      newValue: String!
    ): Application @auth(requires: ["Perform CMS Action"])
    removeApplicationTagSuggestion(applicationId: ID!, value: String!): ApplicationTagSuggestion
      @auth(requires: ["Perform CMS Action"])
  }
`;

export interface SuggestedApplicationTagSource {
  documentId: string;
  documentName: string;
  startPageNo: number;
  endPageNo: number;
  textStartIndex: number;
  textEndIndex: number;
  textLength: number;
  confidence: number;
}

export interface SuggestedApplicationTag {
  tagName: TagName;
  sources: SuggestedApplicationTagSource[];
}
