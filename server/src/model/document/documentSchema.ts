import { gql } from "graphql-tag";

import { Demonstration } from "../demonstration/demonstrationSchema.js";
import { Amendment, Extension } from "../modification/modificationSchema.js";
import { User } from "../user/userSchema.js";
import { DocumentType } from "../../types.js";

export const documentSchema = gql`
  """
  A string representing a document type. Expected values are:
  - Application Completeness Letter
  - Approval Letter
  - Final BN Worksheet
  - Final Budget Neutrality Formulation Workbook
  - Formal OMB Policy Concurrence Email
  - General File
  - Internal Completeness Review Form
  - Payment Ratio Analysis
  - Pre-Submission
  - Q&A
  - Signed Decision Memo
  - State Application
  """
  scalar DocumentType
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
    documentType: DocumentType!
    bundleId: ID!
  }

  input UpdateDocumentInput {
    title: String
    description: String
    documentType: DocumentType
    bundleId: ID
  }

  type Mutation {
    uploadDocument(input: UploadDocumentInput!): String!
    updateDocument(id: ID!, input: UpdateDocumentInput!): Document
    deleteDocuments(ids: [ID!]!): Int!
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
  documentType: DocumentType;
  bundleId: string;
}

export interface UpdateDocumentInput {
  title?: string;
  description?: string;
  documentType?: DocumentType;
  bundleId?: string;
}
