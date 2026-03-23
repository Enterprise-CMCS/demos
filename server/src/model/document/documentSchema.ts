import { gql } from "graphql-tag";

import { User } from "../user/userSchema.js";
import { DocumentType, Application, PhaseName, NonEmptyString } from "../../types.js";

export const documentSchema = gql`
  type Document {
    id: ID! @auth(requires: "Resolve Document")
    name: NonEmptyString! @auth(requires: "Resolve Document")
    description: String @auth(requires: "Resolve Document")
    s3Path: String! @auth(requires: "Download Document")
    owner: User! @auth(requires: "Resolve Document Owner")
    documentType: DocumentType! @auth(requires: "Resolve Document")
    application: Application! @auth(requires: "Resolve Document Application")
    phaseName: PhaseName! @auth(requires: "Resolve Document Application Workflow")
    presignedDownloadUrl: String! @auth(requires: "Download Document")
    createdAt: DateTime! @auth(requires: "Resolve Document")
    updatedAt: DateTime! @auth(requires: "Resolve Document")
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
      @auth(requires: "Mutate Documents")
    updateDocument(id: ID!, input: UpdateDocumentInput!): Document
      @auth(requires: "Mutate Documents")
    deleteDocument(id: ID!): Document! @auth(requires: "Mutate Documents")
    deleteDocuments(ids: [ID!]!): Int! @auth(requires: "Mutate Documents")
    triggerUiPath(documentId: ID!): String! @auth(requires: "Trigger UIPath")
  }

  type Query {
    document(id: ID!): Document @auth(requires: "Query Documents")
    documentExists(documentId: ID!): Boolean! @auth(requires: "Query Documents")
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
