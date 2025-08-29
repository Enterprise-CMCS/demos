import { gql } from "graphql-tag";
import { User } from "../user/userSchema.js";
import { Bundle } from "../bundle/bundleSchema.js";
import { DocumentType } from "../documentType/documentTypeSchema.js";

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
    ownerUserId: ID!
    documentTypeId: DocumentType!
    bundleId: ID!
  }

  input UpdateDocumentInput {
    title: String
    description: String
    ownerUserId: ID
    documentTypeId: DocumentType
    bundleId: ID
  }

  type Mutation {
    uploadDocument(input: UploadDocumentInput!): Document
    updateDocument(id: ID!, input: UpdateDocumentInput!): Document
    deleteDocuments(ids: [ID!]!): Int!
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
  ownerUserId: string;
  documentTypeId: DocumentType;
  bundleId: string;
}

export interface UpdateDocumentInput {
  title?: string;
  description?: string;
  ownerUserId?: string;
  documentTypeId?: DocumentType;
  bundleId?: string;
}
