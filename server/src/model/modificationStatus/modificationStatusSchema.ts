import { gql } from "graphql-tag";
import { Amendment, Extension } from "../modification/modificationSchema.js";

export const modificationStatusSchema = gql`
  type AmendmentStatus {
    id: String!
    name: String!
    description: String!
    createdAt: DateTime!
    updatedAt: DateTime!
    amendments: [Amendment!]!
  }

  input AddAmendmentStatusInput {
    id: String!
    name: String!
    description: String!
  }

  input UpdateAmendmentStatusInput {
    name: String
    description: String
  }

  type ExtensionStatus {
    id: String!
    name: String!
    description: String!
    createdAt: DateTime!
    updatedAt: DateTime!
    extensions: [Extension!]!
  }

  input AddExtensionStatusInput {
    id: String!
    name: String!
    description: String!
  }

  input UpdateExtensionStatusInput {
    name: String
    description: String
  }

  type Mutation {
    addAmendmentStatus(input: AddAmendmentStatusInput!): AmendmentStatus
    updateAmendmentStatus(
      id: String!
      input: UpdateAmendmentStatusInput!
    ): AmendmentStatus
    deleteAmendmentStatus(id: String!): AmendmentStatus
    addExtensionStatus(input: AddExtensionStatusInput!): ExtensionStatus
    updateExtensionStatus(
      id: String!
      input: UpdateExtensionStatusInput!
    ): ExtensionStatus
    deleteExtensionStatus(id: String!): ExtensionStatus
  }

  type Query {
    amendmentStatuses: [AmendmentStatus!]!
    amendmentStatus(id: String!): AmendmentStatus
    extensionStatuses: [ExtensionStatus]!
    extensionStatus(id: String!): ExtensionStatus
  }
`;

export type DateTime = Date;
export interface AmendmentStatus {
  id: string;
  name: string;
  description: string;
  createdAt: DateTime;
  updatedAt: DateTime;
  amendments: Amendment[];
}

export interface AddAmendmentStatusInput {
  id: string;
  name: string;
  description: string;
}

export interface UpdateAmendmentStatusInput {
  name?: string;
  description?: string;
}

export interface ExtensionStatus {
  id: string;
  name: string;
  description: string;
  createdAt: DateTime;
  updatedAt: DateTime;
  extensions: Extension[];
}
export interface AddExtensionStatusInput {
  id: string;
  name: string;
  description: string;
}
export interface UpdateExtensionStatusInput {
  name?: string;
  description?: string;
}
