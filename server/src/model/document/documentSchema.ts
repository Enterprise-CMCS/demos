import { gql } from "graphql-tag";

import { User } from "../user/userSchema.js";
import { DocumentType, Bundle } from "../../types.js";

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
  }

  input UpdateDocumentInput {
    title: String
    description: String
    documentType: DocumentType
    bundleId: ID
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
}

export interface UpdateDocumentInput {
  title?: string;
  description?: string;
  documentType?: DocumentType;
  bundleId?: string;
}
