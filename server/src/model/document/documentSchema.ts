import { Demonstration } from "../demonstration/demonstrationSchema.js";
import { User } from "../user/userSchema.js"
import { gql } from "graphql-tag";
import { DocumentType } from "../documentType/documentTypeSchema.js";

export const documentSchema = gql`
  type Document {
    id: ID!
    title: String!
    description: String!
    s3Path: String!
    owner: User!
    documentType: DocumentType!
    bundle: Demonstration!
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

  type Mutation {
    addDemonstrationDocument(input: AddDemonstrationDocumentInput!): Document
    updateDemonstrationDocument(id: ID!, input: UpdateDemonstrationDocumentInput!): Document
    deleteDemonstrationDocument(id: ID!): Document
  }

  type Query {
    documents(bundleTypeId: String): [Document]!
    document(id: ID!): Document
  }
`;

export type DateTime = Date;
export interface Document {
  id: string;
  title: string;
  description: string;
  s3Path: string;
  owner: User;
  documentType: DocumentType;
  bundle: Demonstration;
  bundleType: string;
  createdAt: DateTime;
  updatedAt: DateTime;
};

export interface AddDemonstrationDocumentInput {
  title: string;
  description: string;
  s3Path: string;
  ownerUserId: string;
  documentTypeId: string;
  demonstrationId: string;
};

export interface UpdateDemonstrationDocumentInput {
  title?: string;
  description?: string;
  s3Path?: string;
  ownerUserId?: string;
  documentTypeId?: string;
  demonstrationId?: string;
};
