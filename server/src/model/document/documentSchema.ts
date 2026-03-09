import { gql } from "graphql-tag";

import { User } from "../user/userSchema.js";
import { DocumentType, Application, PhaseName, NonEmptyString } from "../../types.js";

export const documentSchema = gql`
  type Document {
    id: ID!
      @auth(
        permissions: [
          "View Application Workflow"
          "Manage Application Workflow"
          "View Demonstration Documents"
          "Manage Demonstration Documents"
          "View Application Documents"
          "Manage Application Documents"
          "Download Document"
        ]
      )
    name: NonEmptyString!
      @auth(
        permissions: [
          "View Application Workflow"
          "Manage Application Workflow"
          "View Demonstration Documents"
          "Manage Demonstration Documents"
          "View Application Documents"
          "Manage Application Documents"
          "Download Document"
        ]
      )
    description: String
      @auth(
        permissions: [
          "View Application Workflow"
          "Manage Application Workflow"
          "View Demonstration Documents"
          "Manage Demonstration Documents"
          "View Application Documents"
          "Manage Application Documents"
        ]
      )
    s3Path: String!
    owner: User!
      @auth(
        permissions: [
          "View Application Workflow"
          "Manage Application Workflow"
          "View Demonstration Documents"
          "Manage Demonstration Documents"
          "View Application Documents"
          "Manage Application Documents"
          "Download Document"
        ]
      )
    documentType: DocumentType!
      @auth(
        permissions: [
          "View Application Workflow"
          "Manage Application Workflow"
          "View Demonstration Documents"
          "Manage Demonstration Documents"
          "View Application Documents"
          "Manage Application Documents"
        ]
      )
    application: Application! @auth(permissions: ["Download Document"])
    phaseName: PhaseName!
      @auth(permissions: ["View Application Workflow", "Manage Application Workflow"])
    presignedDownloadUrl: String! @auth(permissions: ["Download Document"])
    createdAt: DateTime!
      @auth(
        permissions: [
          "View Application Workflow"
          "Manage Application Workflow"
          "View Demonstration Documents"
          "Manage Demonstration Documents"
          "View Application Documents"
          "Manage Application Documents"
          "Download Document"
        ]
      )
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
      @auth(permissions: ["Manage Demonstration Documents", "Manage Application Documents"])
    documentId: ID!
      @auth(permissions: ["Manage Demonstration Documents", "Manage Application Documents"])
  }

  type Mutation {
    uploadDocument(input: UploadDocumentInput!): UploadDocumentResponse!
      @auth(
        permissions: [
          "Manage Application Workflow"
          "Manage Demonstration Documents"
          "Manage Application Documents"
        ]
      )
    updateDocument(id: ID!, input: UpdateDocumentInput!): Document
      @auth(
        permissions: [
          "Manage Application Workflow"
          "Manage Demonstration Documents"
          "Manage Application Documents"
        ]
      )
    deleteDocument(id: ID!): Document!
      @auth(
        permissions: [
          "Manage Application Workflow"
          "Manage Demonstration Documents"
          "Manage Application Documents"
        ]
      )
    deleteDocuments(ids: [ID!]!): Int!
      @auth(
        permissions: [
          "Manage Application Workflow"
          "Manage Demonstration Documents"
          "Manage Application Documents"
        ]
      )
    triggerUiPath(documentId: ID!): String!
  }

  type Query {
    document(id: ID!): Document @auth(permissions: ["Download Document"])
    documentExists(documentId: ID!): Boolean!
      @auth(permissions: ["Manage Demonstration Documents", "Manage Application Documents"])
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
