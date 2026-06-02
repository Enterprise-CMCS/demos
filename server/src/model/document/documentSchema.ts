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
    s3Path: NonEmptyString! @auth(requires: ["Access CMS Field"])
    owner: User!
    documentType: DocumentType!
    application: Application! @auth(requires: ["Access CMS Field"])
    phaseName: PhaseName @auth(requires: ["Access CMS Field"])
    presignedDownloadUrl: String! @auth(requires: ["Access CMS Field"])
    deliverable: Deliverable @auth(requires: ["Access CMS Field"])
    isPartOfDeliverableSubmission: Boolean!
    hasPendingUIPathResult: Boolean! @auth(requires: ["Access CMS Field"])
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input UpdateDocumentInput {
    name: NonEmptyString
    description: String
    documentType: DocumentType
  }

  type Mutation {
    updateDocument(id: ID!, input: UpdateDocumentInput!): Document!
      @auth(requires: ["Perform CMS Action", "Perform State Action"])
    deleteDocument(id: ID!): Document!
      @auth(requires: ["Perform CMS Action", "Perform State Action"])
    deleteDocuments(ids: [ID!]!): Int!
      @auth(requires: ["Perform CMS Action", "Perform State Action"])
    triggerUiPath(documentId: ID!): String! @auth(requires: ["Perform CMS Action"])
  }

  type Query {
    document(id: ID!): Document! @auth(requires: ["Access CMS Query"])
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
  isPartOfDeliverableSubmission: boolean;
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
