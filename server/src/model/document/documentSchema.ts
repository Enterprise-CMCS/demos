import { gql } from "graphql-tag";

import {
  Application,
  Deliverable,
  DocumentType,
  NonEmptyString,
  PhaseName,
  User,
} from "../../types.js";

export const documentSchema = gql`
  type Document {
    id: ID!
    name: NonEmptyString!
    description: String
    s3Path: NonEmptyString!
    owner: User!
    documentType: DocumentType!
    application: Application!
    phaseName: PhaseName
    presignedDownloadUrl: String!
    deliverable: Deliverable
    hasPendingUIPathResult: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input UploadDocumentToApplicationInput {
    name: NonEmptyString!
    description: String
    documentType: DocumentType!
    applicationId: ID!
  }

  input UploadDocumentToApplicationPhaseInput {
    name: NonEmptyString!
    description: String
    documentType: DocumentType!
    applicationId: ID!
    phaseName: PhaseName!
  }

  input UploadDocumentToDeliverableInput {
    name: NonEmptyString!
    description: String
    documentType: DocumentType!
    applicationId: ID!
    deliverableId: ID!
    isCmsAttachedFile: Boolean!
  }

  input UpdateDocumentInput {
    name: NonEmptyString
    description: String
    documentType: DocumentType
  }

  type UploadDocumentResponse {
    presignedURL: String!
    documentId: ID!
  }

  type Mutation {
    uploadDocumentToApplication(input: UploadDocumentToApplicationInput!): UploadDocumentResponse!
    uploadDocumentToApplicationPhase(
      input: UploadDocumentToApplicationPhaseInput!
    ): UploadDocumentResponse!
    uploadDocumentToDeliverable(input: UploadDocumentToDeliverableInput!): UploadDocumentResponse!
    updateDocument(id: ID!, input: UpdateDocumentInput!): Document
    deleteDocument(id: ID!): Document!
    deleteDocuments(ids: [ID!]!): Int!
    triggerUiPath(documentId: ID!): String!
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
  s3Path: NonEmptyString;
  owner: User;
  documentType: DocumentType;
  application: Application;
  phaseName?: PhaseName;
  deliverable?: Deliverable;
  createdAt: Date;
  updatedAt: Date;
  presignedDownloadUrl: string;
  hasPendingUIPathResult: boolean;
}

export interface UploadDocumentToApplicationInput {
  name: NonEmptyString;
  description?: string;
  documentType: DocumentType;
  applicationId: string;
}

export interface UploadDocumentToApplicationPhaseInput {
  name: NonEmptyString;
  description?: string;
  documentType: DocumentType;
  applicationId: string;
  phaseName: PhaseName;
}

export interface UploadDocumentToDeliverableInput {
  name: NonEmptyString;
  description?: string;
  documentType: DocumentType;
  applicationId: string;
  deliverableId: string;
  isCmsAttachedFile: boolean;
}

export interface UpdateDocumentInput {
  name?: NonEmptyString;
  description?: string;
  documentType?: DocumentType;
}

export interface UploadDocumentResponse {
  presignedURL: string;
  documentId: string;
}
