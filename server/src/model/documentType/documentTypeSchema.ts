import { gql } from "graphql-tag";
import { Document } from "../document/documentSchema.js";

export const documentTypeSchema = gql`
  type DocumentType {
    id: String!
    name: String!
    description: String!
    createdAt: DateTime!
    updatedAt: DateTime!
    documents: [Document!]!
  }

  input AddDocumentTypeInput {
    id: String!
    name: String!
    description: String!
  }

  input UpdateDocumentTypeInput {
    name: String
    description: String
  }

  type Mutation {
    addDocumentType(input: AddDocumentTypeInput!): DocumentType
    updateDocumentType(
      id: String!
      input: UpdateDocumentTypeInput!
    ): DocumentType
    deleteDocumentType(id: String!): DocumentType
  }

  type Query {
    documentTypes: [DocumentType!]!
    documentType(id: String!): DocumentType
  }
`;

export type DateTime = Date;
export interface DocumentType {
  id: string;
  name: string;
  description: string;
  createdAt: DateTime;
  updatedAt: DateTime;
  documents: Document[];
}

export interface AddDocumentTypeInput {
  id: string;
  name: string;
  description: string;
}

export interface UpdateDocumentTypeInput {
  name?: string;
  description?: string;
}
