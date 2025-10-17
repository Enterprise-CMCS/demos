import { gql } from "graphql-tag";

import {
  PhaseName,
  BundleStatus,
  BundlePhase,
  Demonstration,
  Document,
  NonEmptyString,
} from "../../types.js";

export const modificationSchema = gql`
  type Amendment {
    id: ID!
    demonstration: Demonstration!
    name: NonEmptyString!
    description: String!
    effectiveDate: DateTime
    expirationDate: DateTime
    status: BundleStatus!
    currentPhaseName: PhaseName!
    phases: [BundlePhase!]!
    documents: [Document!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CreateAmendmentInput {
    demonstrationId: ID!
    name: NonEmptyString!
    description: String
  }

  input UpdateAmendmentInput {
    demonstrationId: ID
    name: NonEmptyString
    description: String
    effectiveDate: DateTime
    expirationDate: DateTime
    status: BundleStatus
    currentPhaseName: PhaseName
  }

  type Extension {
    id: ID!
    demonstration: Demonstration!
    name: NonEmptyString!
    description: String!
    effectiveDate: DateTime
    expirationDate: DateTime
    status: BundleStatus!
    currentPhaseName: PhaseName!
    phases: [BundlePhase!]!
    documents: [Document!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CreateExtensionInput {
    demonstrationId: ID!
    name: NonEmptyString!
    description: String
  }

  input UpdateExtensionInput {
    demonstrationId: ID
    name: NonEmptyString
    description: String
    effectiveDate: DateTime
    expirationDate: DateTime
    status: BundleStatus
    currentPhaseName: PhaseName
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
  name: NonEmptyString;
  description: string;
  effectiveDate: Date | null;
  expirationDate: Date | null;
  status: BundleStatus;
  currentPhaseName: PhaseName;
  phases: BundlePhase[];
  documents: Document[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAmendmentInput {
  demonstrationId: string;
  name: NonEmptyString;
  description: string | null;
}

export interface UpdateAmendmentInput {
  demonstrationId?: string;
  name?: NonEmptyString;
  description?: string;
  effectiveDate?: Date;
  expirationDate?: Date;
  status?: BundleStatus;
  currentPhaseName?: PhaseName;
}

export interface Extension {
  id: string;
  demonstration: Demonstration;
  name: NonEmptyString;
  description: string;
  effectiveDate: Date | null;
  expirationDate: Date | null;
  status: BundleStatus;
  currentPhaseName: PhaseName;
  phases: BundlePhase[];
  documents: Document[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExtensionInput {
  demonstrationId: string;
  name: NonEmptyString;
  description: string | null;
}

export interface UpdateExtensionInput {
  demonstrationId?: string;
  name?: NonEmptyString;
  description?: string;
  effectiveDate?: Date;
  expirationDate?: Date;
  status?: BundleStatus;
  currentPhaseName?: PhaseName;
}
