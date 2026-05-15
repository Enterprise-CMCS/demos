import { gql } from "graphql-tag";

import {
  Application,
  Deliverable,
  DocumentType,
  NonEmptyString,
  PhaseName,
  User,
} from "../../types.js";

export const documentPendingUploadSchema = gql`
  type DocumentPendingUpload {
    id: ID!
    name: NonEmptyString!
    description: String
    owner: User!
    documentType: DocumentType!
    application: Application! @auth(requires: "Access Document Application")
    phaseName: PhaseName @auth(requires: "Access Document Application")
    presignedUploadUrl: String! @auth(requires: "Access Document Upload")
    deliverable: Deliverable @auth(requires: "Access Document Deliverable")
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input UploadDocumentToApplicationInput {
    name: NonEmptyString!
    description: String
    documentType: DocumentType!
    applicationId: ID!
  }

  input UploadDocumentToPhaseInput {
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

  type Mutation {
    uploadDocumentToApplication(input: UploadDocumentToApplicationInput!): DocumentPendingUpload!
      @auth(requires: "Access Upload Application Document")
    uploadDocumentToPhase(input: UploadDocumentToPhaseInput!): DocumentPendingUpload!
      @auth(requires: "Access Upload Phase Document")
    uploadDocumentToDeliverable(input: UploadDocumentToDeliverableInput!): DocumentPendingUpload!
  }
`;

export interface DocumentPendingUpload {
  id: string;
  name: NonEmptyString;
  description?: string;
  owner: User;
  documentType: DocumentType;
  application: Application;
  phaseName?: PhaseName;
  deliverable?: Deliverable;
  createdAt: Date;
  updatedAt: Date;
  presignedUploadUrl: string;
}

export interface UploadDocumentToApplicationInput {
  name: NonEmptyString;
  description?: string;
  documentType: DocumentType;
  applicationId: string;
}

export interface UploadDocumentToPhaseInput {
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
