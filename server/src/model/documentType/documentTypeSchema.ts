import { gql } from "graphql-tag";
import { Document } from "../document/documentSchema.js";

export const documentTypeSchema = gql`
  type DocumentType {
    id: ID!
    description: String!
    createdAt: DateTime!
    updatedAt: DateTime!
    documents: [Document!]!
  }

  type Query {
    documentTypes: [DocumentType]!
    documentType(id: String!): DocumentType
  }
`;

export type DateTime = Date;
export interface DocumentType {
  id: string;
  description: string;
  createdAt: DateTime;
  updatedAt: DateTime;
  documents: Document[];
};
