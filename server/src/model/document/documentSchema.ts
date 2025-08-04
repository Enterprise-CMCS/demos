import { gql } from "graphql-tag";

import { Demonstration } from "../demonstration/demonstrationSchema.js";
import { DocumentType } from "../documentType/documentTypeSchema.js";
import {
  Amendment,
  Extension,
} from "../modification/modificationSchema.js";
import { User } from "../user/userSchema.js";
import { Dayjs } from "dayjs";

export const documentSchema = gql`
  union Bundle = Demonstration | Amendment
  type Document {
    id: ID!
    title: String!
    description: String!
    s3Path: String!
    owner: User!
    documentType: DocumentType!
    bundle: Bundle!
    bundleType: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CreateDemonstrationDocumentInput {
    title: String!
    description: String!
    s3Path: String!
    ownerUserId: ID!
    documentTypeId: String!
    demonstrationId: ID!
  }

  input UpdateDemonstrationDocumentInput {
    title: String
    description: String
    s3Path: String
    ownerUserId: ID
    documentTypeId: String
    demonstrationId: ID
  }

  input CreateAmendmentDocumentInput {
    title: String!
    description: String!
    s3Path: String!
    ownerUserId: ID!
    documentTypeId: String!
    amendmentId: ID!
  }

  input UpdateAmendmentDocumentInput {
    title: String
    description: String
    s3Path: String
    ownerUserId: ID
    documentTypeId: String
    amendmentId: ID
  }

  input CreateExtensionDocumentInput {
    title: String!
    description: String!
    s3Path: String!
    ownerUserId: ID!
    documentTypeId: String!
    extensionId: ID!
  }

  input UpdateExtensionDocumentInput {
    title: String
    description: String
    s3Path: String
    ownerUserId: ID
    documentTypeId: ID
    extensionId: ID
  }

  type Mutation {
    createDemonstrationDocument(
      input: CreateDemonstrationDocumentInput!
    ): Document
    updateDemonstrationDocument(
      id: ID!
      input: UpdateDemonstrationDocumentInput!
    ): Document
    deleteDemonstrationDocument(id: ID!): Document
    createAmendmentDocument(input: CreateAmendmentDocumentInput!): Document
    updateAmendmentDocument(
      id: ID!
      input: UpdateAmendmentDocumentInput!
    ): Document
    deleteAmendmentDocument(id: ID!): Document
    createExtensionDocument(input: CreateExtensionDocumentInput!): Document
    updateExtensionDocument(
      id: ID!
      input: UpdateExtensionDocumentInput!
    ): Document
    deleteExtensionDocument(id: ID!): Document
  }

  type Query {
    documents(bundleTypeId: String): [Document!]!
    document(id: ID!): Document
  }
`;

type Bundle = Demonstration | Amendment | Extension;
export type DateTime = Dayjs;
export interface Document {
  id: string;
  title: string;
  description: string;
  s3Path: string;
  owner: User;
  documentType: DocumentType;
  bundle: Bundle;
  bundleType: string;
  createdAt: DateTime;
  updatedAt: DateTime;
}

export interface CreateDemonstrationDocumentInput {
  title: string;
  description: string;
  s3Path: string;
  ownerUserId: string;
  documentTypeId: string;
  demonstrationId: string;
}

export interface UpdateDemonstrationDocumentInput {
  title?: string;
  description?: string;
  s3Path?: string;
  ownerUserId?: string;
  documentTypeId?: string;
  demonstrationId?: string;
}

export interface CreateAmendmentDocumentInput {
  title: string;
  description: string;
  s3Path: string;
  ownerUserId: string;
  documentTypeId: string;
  amendmentId: string;
}

export interface UpdateAmendmentDocumentInput {
  title?: string;
  description?: string;
  s3Path?: string;
  ownerUserId?: string;
  documentTypeId?: string;
  amendmentId?: string;
}

export interface CreateExtensionDocumentInput {
  title: string;
  description: string;
  s3Path: string;
  ownerUserId: string;
  documentTypeId: string;
  extensionId: string;
}

export interface UpdateExtensionDocumentInput {
  title?: string;
  description?: string;
  s3Path?: string;
  ownerUserId?: string;
  documentTypeId?: string;
  extensionId?: string;
}
