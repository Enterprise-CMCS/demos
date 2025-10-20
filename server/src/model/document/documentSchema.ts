import { gql } from "graphql-tag";

import { User } from "../user/userSchema.js";
import { DocumentType, Application, PhaseName, NonEmptyString } from "../../types.js";

export const documentSchema = gql`
  type Document {
    id: ID!
    name: NonEmptyString!
    description: NonEmptyString!
    s3Path: String!
    owner: User!
    documentType: DocumentType!
    application: Application!
    phaseName: PhaseName!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input UploadDocumentInput {
    name: NonEmptyString!
    description: NonEmptyString!
    documentType: DocumentType!
    applicationId: ID!
    phaseName: PhaseName!
  }

  input UpdateDocumentInput {
    name: NonEmptyString
    description: NonEmptyString
    documentType: DocumentType
    applicationId: ID
    phaseName: PhaseName
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
    document(id: ID!): Document
  }
`;

export interface Document {
  id: string;
  name: NonEmptyString;
  description: NonEmptyString;
  s3Path: string;
  owner: User;
  documentType: DocumentType;
  application: Application;
  phaseName: PhaseName;
  createdAt: Date;
  updatedAt: Date;
}

export interface UploadDocumentInput {
  name: NonEmptyString;
  description: NonEmptyString;
  documentType: DocumentType;
  applicationId: string;
  phaseName: PhaseName;
}

export interface UpdateDocumentInput {
  name?: NonEmptyString;
  description?: NonEmptyString;
  documentType?: DocumentType;
  applicationId?: string;
  phaseName?: PhaseName;
}
