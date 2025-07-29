import { Demonstration } from "../demonstration/demonstrationSchema.js";
import { Amendment } from "../modification/modificationSchema.js";
import { User } from "../user/userSchema.js";
import { gql } from "graphql-tag";
import { DocumentType } from "../documentType/documentTypeSchema.js";
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

  input AddDemonstrationDocumentInput {
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

  input AddAmendmentDocumentInput {
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

  type Mutation {
    addDemonstrationDocument(input: AddDemonstrationDocumentInput!): Document
    updateDemonstrationDocument(
      id: ID!
      input: UpdateDemonstrationDocumentInput!
    ): Document
    deleteDemonstrationDocument(id: ID!): Document
    addAmendmentDocument(input: AddAmendmentDocumentInput!): Document
    updateAmendmentDocument(
      id: ID!
      input: UpdateAmendmentDocumentInput!
    ): Document
    deleteAmendmentDocument(id: ID!): Document
  }

  type Query {
    documents(bundleTypeId: String): [Document]!
    document(id: ID!): Document
  }
`;

type Bundle = Demonstration | Amendment;
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

export interface AddDemonstrationDocumentInput {
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

export interface AddAmendmentDocumentInput {
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
