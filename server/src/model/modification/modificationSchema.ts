import { gql } from "graphql-tag";

import { Demonstration } from "../demonstration/demonstrationSchema.js";
import { Document } from "../document/documentSchema.js";
import {
  AmendmentStatus,
  ExtensionStatus,
} from "../modificationStatus/modificationStatusSchema.js";
import { User } from "../user/userSchema.js";

export const modificationSchema = gql`
  type Amendment {
    id: ID!
    demonstration: Demonstration!
    name: String!
    description: String!
    effectiveDate: Date
    expirationDate: Date
    createdAt: DateTime!
    updatedAt: DateTime!
    amendmentStatus: AmendmentStatus!
    projectOfficer: User!
    documents: [Document!]!
  }

  input CreateAmendmentInput {
    demonstrationId: ID!
    name: String!
    description: String!
    effectiveDate: Date
    expirationDate: Date
    amendmentStatusId: ID!
    projectOfficerUserId: String!
  }

  input UpdateAmendmentInput {
    demonstrationId: ID
    name: String
    description: String
    effectiveDate: Date
    expirationDate: Date
    amendmentStatusId: ID
    projectOfficerUserId: String
  }

  type Extension {
    id: ID!
    demonstration: Demonstration!
    name: String!
    description: String!
    effectiveDate: Date
    expirationDate: Date
    createdAt: DateTime!
    updatedAt: DateTime!
    extensionStatus: ExtensionStatus!
    projectOfficer: User!
    documents: [Document!]!
  }

  input AddExtensionInput {
    demonstrationId: ID!
    name: String!
    description: String!
    effectiveDate: Date
    expirationDate: Date
    extensionStatusId: ID!
    projectOfficerUserId: String!
  }

  input UpdateExtensionInput {
    demonstrationId: ID
    name: String
    description: String
    effectiveDate: Date
    expirationDate: Date
    extensionStatusId: ID
    projectOfficerUserId: String
  }

  type Mutation {
    createAmendment(input: CreateAmendmentInput!): Amendment
    updateAmendment(id: ID!, input: UpdateAmendmentInput!): Amendment
    deleteAmendment(id: ID!): Amendment
    addExtension(input: AddExtensionInput!): Extension
    updateExtension(id: ID!, input: UpdateExtensionInput!): Extension
    deleteExtension(id: ID!): Extension
  }

  type Query {
    amendments: [Amendment!]!
    amendment(id: ID!): Amendment
    extensions: [Extension]!
    extension(id: ID!): Extension
  }
`;

export interface Amendment {
  id: string;
  demonstration: Demonstration;
  name: string;
  description: string;
  effectiveDate?: Date;
  expirationDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  amendmentStatus: AmendmentStatus;
  projectOfficer: User;
  documents: Document[];
}

export interface CreateAmendmentInput {
  demonstrationId: string;
  name: string;
  description: string;
  effectiveDate?: Date;
  expirationDate?: Date;
  amendmentStatusId: string;
  projectOfficerUserId: string;
}

export interface UpdateAmendmentInput {
  demonstrationId?: string;
  name?: string;
  description?: string;
  effectiveDate?: Date;
  expirationDate?: Date;
  amendmentStatusId?: string;
  projectOfficerUserId?: string;
}

export interface Extension {
  id: string;
  demonstration: Demonstration;
  name: string;
  description: string;
  effectiveDate?: Date;
  expirationDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  extensionStatus: ExtensionStatus;
  projectOfficer: User;
  documents: Document[];
}

export interface AddExtensionInput {
  demonstrationId: string;
  name: string;
  description: string;
  effectiveDate?: Date;
  expirationDate?: Date;
  extensionStatusId: string;
  projectOfficerUserId: string;
}

export interface UpdateExtensionInput {
  demonstrationId?: string;
  name?: string;
  description?: string;
  effectiveDate?: Date;
  expirationDate?: Date;
  extensionStatusId?: string;
  projectOfficerUserId?: string;
}
