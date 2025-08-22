import { gql } from "graphql-tag";

import { Demonstration } from "../demonstration/demonstrationSchema.js";
import { DocumentType } from "../documentType/documentTypeSchema.js";
import { Amendment, Extension } from "../modification/modificationSchema.js";
import { User } from "../user/userSchema.js";

export const documentSchema = gql`
  union Bundle = Demonstration | Amendment | Extension

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
    documentType: String!
    ownerUserId: ID!
    demonstrationId: ID!
  }

  input UpdateDocumentInput {
    id: ID!
    title: String
    description: String
    documentType: String
  }

  type Mutation {
    uploadDocument(input: UploadDocumentInput!): Document
    updateDocument(input: UpdateDocumentInput!): Document
    deleteDocuments(ids: [ID!]!): [ID!]!
  }

  type Query {
    documents(bundleTypeId: String): [Document!]!
    document(id: ID!): Document
  }
`;

type Bundle = Demonstration | Amendment | Extension;
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
  documentTypeId: string;
  demonstrationId: string;
}

export interface UpdateDocumentInput {
  title?: string;
  description?: string;
  s3Path?: string;
  ownerUserId?: string;
  documentTypeId?: string;
  demonstrationId?: string;
}
