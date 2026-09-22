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
    application: Application!
    phaseName: PhaseName @auth(requires: ["Perform CMS Action"])
    presignedUploadUrl: String!
    deliverable: Deliverable
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
  }

  type Mutation {
    uploadDocumentToApplication(input: UploadDocumentToApplicationInput!): DocumentPendingUpload!
      @auth(requires: ["Modify Documents"])
    uploadDocumentToPhase(input: UploadDocumentToPhaseInput!): DocumentPendingUpload!
      @auth(requires: ["Modify Documents"])
    uploadDocumentToDeliverableCMSFiles(
      input: UploadDocumentToDeliverableInput!
    ): DocumentPendingUpload! @auth(requires: ["Modify Deliverable CMS Documents"])
    uploadDocumentToDeliverableStateFiles(
      input: UploadDocumentToDeliverableInput!
    ): DocumentPendingUpload! @auth(requires: ["Modify Deliverable State Documents"])
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
}
