import { gql } from "graphql-tag";

import { User } from "../user/userSchema.js";
import { DocumentType, Bundle, Phase } from "../../types.js";

export const documentSchema = gql`
  type Document {
    id: ID!
    title: String!
    description: String!
    s3Path: String!
    owner: User!
    documentType: DocumentType!
    bundle: Bundle!
    bundleType: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input UploadDocumentInput {
    title: String!
    description: String!
    documentType: DocumentType!
    bundleId: ID!
    phase: Phase!
  }

  input UpdateDocumentInput {
    title: String
    description: String
    documentType: DocumentType
    bundleId: ID
    phase: Phase
  }

  type UploadDocumentResponse {
    presignedURL: String!
  }

  type Mutation {
    uploadDocument(input: UploadDocumentInput!): UploadDocumentResponse!
    updateDocument(id: ID!, input: UpdateDocumentInput!): Document
    deleteDocuments(ids: [ID!]!): Int!
    downloadDocument(id: ID!): String
  }

  type Query {
    documents(bundleTypeId: String): [Document!]!
    document(id: ID!): Document
  }
`;

export interface Document {
  id: string;
  title: string;
  description: string;
  s3Path: string;
  owner: User;
  documentType: DocumentType;
  bundle: Bundle;
  bundleType: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UploadDocumentInput {
  title: string;
  description: string;
  documentType: DocumentType;
  bundleId: string;
  phase: Phase;
}

export interface UpdateDocumentInput {
  title?: string;
  description?: string;
  documentType?: DocumentType;
  bundleId?: string;
  phase?: Phase;
}
