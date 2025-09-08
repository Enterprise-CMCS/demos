import { gql } from "graphql-tag";

import { Demonstration } from "../demonstration/demonstrationSchema.js";
import { Document } from "../document/documentSchema.js";
import {
  AmendmentStatus,
  ExtensionStatus,
} from "../modificationStatus/modificationStatusSchema.js";
import { User } from "../user/userSchema.js";
import { Phase } from "../../types.js";

export const modificationSchema = gql`
  type Amendment {
    id: ID!
    demonstration: Demonstration!
    name: String!
    description: String!
    effectiveDate: Date
    expirationDate: Date
    amendmentStatus: AmendmentStatus!
    currentPhase: Phase!
    projectOfficer: User!
    documents: [Document!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CreateAmendmentInput {
    demonstrationId: ID!
    name: String!
    description: String!
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
    currentPhase: Phase
    projectOfficerUserId: String
  }

  type Extension {
    id: ID!
    demonstration: Demonstration!
    name: String!
    description: String!
    effectiveDate: Date
    expirationDate: Date
    extensionStatus: ExtensionStatus!
    currentPhase: Phase!
    projectOfficer: User!
    documents: [Document!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input AddExtensionInput {
    demonstrationId: ID!
    name: String!
    description: String!
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
    currentPhase: Phase
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
  effectiveDate: Date | null;
  expirationDate: Date | null;
  amendmentStatus: AmendmentStatus;
  currentPhase: Phase;
  projectOfficer: User;
  documents: Document[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAmendmentInput {
  demonstrationId: string;
  name: string;
  description: string;
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
  currentPhase?: Phase;
  projectOfficerUserId?: string;
}

export interface Extension {
  id: string;
  demonstration: Demonstration;
  name: string;
  description: string;
  effectiveDate: Date | null;
  expirationDate: Date | null;
  extensionStatus: ExtensionStatus;
  currentPhase: Phase;
  projectOfficer: User;
  documents: Document[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AddExtensionInput {
  demonstrationId: string;
  name: string;
  description: string;
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
  currentPhase?: Phase;
  projectOfficerUserId?: string;
}
