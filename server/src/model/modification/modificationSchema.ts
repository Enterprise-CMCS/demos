import { gql } from "graphql-tag";

import { Demonstration } from "../demonstration/demonstrationSchema.js";
import { Document } from "../document/documentSchema.js";
import { User } from "../user/userSchema.js";
import { Phase, BundleStatus } from "../../types.js";

export const modificationSchema = gql`
  type Amendment {
    id: ID!
    demonstration: Demonstration!
    name: String!
    description: String!
    effectiveDate: Date
    expirationDate: Date
    status: BundleStatus!
    currentPhase: Phase!
    projectOfficer: User!
    documents: [Document!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CreateAmendmentInput {
    demonstrationId: ID!
    name: String!
    description: String
    projectOfficerUserId: String!
  }

  input UpdateAmendmentInput {
    demonstrationId: ID
    name: String
    description: String
    effectiveDate: Date
    expirationDate: Date
    status: BundleStatus
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
    status: BundleStatus!
    currentPhase: Phase!
    projectOfficer: User!
    documents: [Document!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CreateExtensionInput {
    demonstrationId: ID!
    name: String!
    description: String
    projectOfficerUserId: String!
  }

  input UpdateExtensionInput {
    demonstrationId: ID
    name: String
    description: String
    effectiveDate: Date
    expirationDate: Date
    status: BundleStatus
    currentPhase: Phase
    projectOfficerUserId: String
  }

  type Mutation {
    createAmendment(input: CreateAmendmentInput!): Amendment
    updateAmendment(id: ID!, input: UpdateAmendmentInput!): Amendment
    deleteAmendment(id: ID!): Amendment
    createExtension(input: CreateExtensionInput!): Extension
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
  status: BundleStatus;
  currentPhase: Phase;
  projectOfficer: User;
  documents: Document[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAmendmentInput {
  demonstrationId: string;
  name: string;
  description: string | null;
  projectOfficerUserId: string;
}

export interface UpdateAmendmentInput {
  demonstrationId?: string;
  name?: string;
  description?: string;
  effectiveDate?: Date;
  expirationDate?: Date;
  status?: BundleStatus;
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
  status: BundleStatus;
  currentPhase: Phase;
  projectOfficer: User;
  documents: Document[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExtensionInput {
  demonstrationId: string;
  name: string;
  description: string | null;
  projectOfficerUserId: string;
}

export interface UpdateExtensionInput {
  demonstrationId?: string;
  name?: string;
  description?: string;
  effectiveDate?: Date;
  expirationDate?: Date;
  status?: BundleStatus;
  currentPhase?: Phase;
  projectOfficerUserId?: string;
}
