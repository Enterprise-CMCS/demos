import { gql } from "graphql-tag";

import {
  PhaseName,
  ApplicationStatus,
  ApplicationPhase,
  Demonstration,
  Document,
  NonEmptyString,
  DateTimeOrLocalDate,
  ClearanceLevel,
  Tag,
} from "../../types.js";

export const extensionSchema = gql`
  type Extension {
    id: ID!
    demonstration: Demonstration!
    name: NonEmptyString!
    description: String
    effectiveDate: DateTime
    expirationDate: DateTime
    status: ApplicationStatus!
    currentPhaseName: PhaseName!
    phases: [ApplicationPhase!]!
    documents: [Document!]!
    createdAt: DateTime!
    updatedAt: DateTime!
    clearanceLevel: ClearanceLevel!
    tags: [Tag!]!
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
    effectiveDate: DateTimeOrLocalDate
    expirationDate: DateTimeOrLocalDate
    status: ApplicationStatus
  }

  type Mutation {
    createExtension(input: CreateExtensionInput!): Extension
    updateExtension(id: ID!, input: UpdateExtensionInput!): Extension
    deleteExtension(id: ID!): Extension
  }

  type Query {
    extensions: [Extension!]!
    extension(id: ID!): Extension
  }
`;

export interface Extension {
  id: string;
  demonstration: Demonstration;
  name: NonEmptyString;
  description?: string;
  effectiveDate?: Date;
  expirationDate?: Date;
  status: ApplicationStatus;
  currentPhaseName: PhaseName;
  phases: ApplicationPhase[];
  documents: Document[];
  clearanceLevel: ClearanceLevel;
  createdAt: Date;
  updatedAt: Date;
  tags: Tag[];
}

export interface CreateExtensionInput {
  demonstrationId: string;
  name: NonEmptyString;
  description: string | null;
}

export interface UpdateExtensionInput {
  demonstrationId?: string;
  name?: NonEmptyString;
  description?: string | null;
  effectiveDate?: DateTimeOrLocalDate | null;
  expirationDate?: DateTimeOrLocalDate | null;
  status?: ApplicationStatus;
}
