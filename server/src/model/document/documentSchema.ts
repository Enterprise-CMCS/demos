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

  input UpdateDocumentInput {
    name: NonEmptyString
    description: String
    documentType: DocumentType
  }

  type Mutation {
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

export interface UpdateDocumentInput {
  name?: NonEmptyString;
  description?: string;
  documentType?: DocumentType;
}
