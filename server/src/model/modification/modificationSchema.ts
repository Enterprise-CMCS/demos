import { gql } from "graphql-tag";

import { PhaseName, BundleStatus, BundlePhase, Demonstration, Document, Modification } from "../../types.js";
import { Modification } from "@prisma/client";

export const modificationSchema = gql`
  type Amendment {
    id: ID!
    demonstration: Demonstration!
    name: String!
    description: String!
    effectiveDate: Date
    expirationDate: Date
    status: BundleStatus!
    currentPhaseName: PhaseName!
    phases: [BundlePhase!]!
    documents: [Document!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CreateAmendmentInput {
    demonstrationId: ID!
    name: String!
    description: String
  }

  input UpdateAmendmentInput {
    demonstrationId: ID
    name: String
    description: String
    effectiveDate: Date
    expirationDate: Date
    status: BundleStatus
    currentPhaseName: PhaseName
  }

  type Extension {
    id: ID!
    demonstration: Demonstration!
    name: String!
    description: String!
    effectiveDate: Date
    expirationDate: Date
    status: BundleStatus!
    currentPhaseName: PhaseName!
    phases: [BundlePhase!]!
    documents: [Document!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CreateExtensionInput {
    demonstrationId: ID!
    name: String!
    description: String
  }

  input UpdateExtensionInput {
    demonstrationId: ID
    name: String
    description: String
    effectiveDate: Date
    expirationDate: Date
    status: BundleStatus
    currentPhaseName: PhaseName
  }

  type CreateAmendmentPayload {
    success: Boolean!
    message: String
    amendment: Amendment!
  }

  type CreateExtensionPayload {
    success: Boolean!
    message: String
    extension: Extension!
  }


  type Mutation {
    createAmendment(input: CreateAmendmentInput!): CreateAmendmentPayload!
    updateAmendment(id: ID!, input: UpdateAmendmentInput!): Amendment
    deleteAmendment(id: ID!): Amendment
    createExtension(input: CreateExtensionInput!): CreateExtensionPayload!
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
  currentPhaseName: PhaseName;
  phases: BundlePhase[];
  documents: Document[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAmendmentInput {
  demonstrationId: string;
  name: string;
  description: string | null;
}

export interface UpdateAmendmentInput {
  demonstrationId?: string;
  name?: string;
  description?: string;
  effectiveDate?: Date;
  expirationDate?: Date;
  status?: BundleStatus;
  currentPhaseName?: PhaseName;
}

export interface Extension {
  id: string;
  demonstration: Demonstration;
  name: string;
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
  name: string;
  description: string | null;
}

export interface UpdateExtensionInput {
  demonstrationId?: string;
  name?: string;
  description?: string;
  effectiveDate?: Date;
  expirationDate?: Date;
  status?: BundleStatus;
  currentPhaseName?: PhaseName;
}

export interface CreateAmendmentPayload {
  success: boolean;
  message?: string | null;
  amendment: Amendment;
}

export interface CreateExtensionPayload {
  success: boolean;
  message?: string | null;
  extension: Extension;
}
