import { gql } from "graphql-tag";

import { User } from "../user/userSchema.js";
import { DocumentType, Application, PhaseName, NonEmptyString } from "../../types.js";

export const documentSchema = gql`
  type Document {
    id: ID!
    name: NonEmptyString!
    description: String
    s3Path: String!
    owner: User!
    documentType: DocumentType!
    application: Application!
    phaseName: PhaseName!
    presignedDownloadUrl: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input UploadDocumentInput {
    name: NonEmptyString!
    description: String
    documentType: DocumentType!
    applicationId: ID!
    phaseName: PhaseName!
  }

  input UpdateDocumentInput {
    name: NonEmptyString
    description: String
    documentType: DocumentType
    applicationId: ID
    phaseName: PhaseName
  }

  type UploadDocumentResponse {
    presignedURL: String!
    documentId: ID!
  }

  type Mutation {
    uploadDocument(input: UploadDocumentInput!): UploadDocumentResponse!
    updateDocument(id: ID!, input: UpdateDocumentInput!): Document
    deleteDocument(id: ID!): Document!
    deleteDocuments(ids: [ID!]!): Int!
    triggerUiPath(documentId: ID!, projectId: String): String!
  }

  type Query {
    document(id: ID!): Document
    documentExists(documentId: ID!): Boolean!
  }
`;

export interface Document {
  id: string;
  name: NonEmptyString;
  description?: string;
  s3Path: string;
  owner: User;
  documentType: DocumentType;
  application: Application;
  phaseName: PhaseName;
  createdAt: Date;
  updatedAt: Date;
  presignedDownloadUrl: string;
}

export interface UploadDocumentInput {
  name: NonEmptyString;
  description?: string;
  documentType: DocumentType;
  applicationId: string;
  phaseName: PhaseName;
}

export interface UpdateDocumentInput {
  name?: NonEmptyString;
  description?: string;
  documentType?: DocumentType;
  applicationId?: string;
  phaseName?: PhaseName;
}

export interface UploadDocumentResponse {
  presignedURL: string;
  documentId: string;
}
