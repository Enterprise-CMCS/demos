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
    s3Path: NonEmptyString! @auth(requires: "Access Document Download")
    owner: User! @auth(requires: "Access Document Owner")
    documentType: DocumentType!
    application: Application! @auth(requires: "Access Document Application")
    phaseName: PhaseName @auth(requires: "Access Document Application")
    presignedDownloadUrl: String! @auth(requires: "Access Document Download")
    deliverable: Deliverable @auth(requires: "Access Document Deliverable")
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
      @auth(requires: "Access CMS-Only Mutations")
    deleteDocument(id: ID!): Document! @auth(requires: "Access CMS-Only Mutations")
    deleteDocuments(ids: [ID!]!): Int! @auth(requires: "Access CMS-Only Mutations")
    triggerUiPath(documentId: ID!): String! @auth(requires: "Access CMS-Only Mutations")
  }

  type Query {
    document(id: ID!): Document @auth(requires: "Access CMS-Only Queries")
    documentExists(documentId: ID!): Boolean! @auth(requires: "Access CMS-Only Queries")
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
