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

export const amendmentSchema = gql`
  type Amendment {
    id: ID!
    demonstration: Demonstration!
    name: NonEmptyString!
    description: String
    effectiveDate: DateTime
    status: ApplicationStatus!
    currentPhaseName: PhaseName!
    phases: [ApplicationPhase!]!
    documents: [Document!]!
    createdAt: DateTime!
    updatedAt: DateTime!
    clearanceLevel: ClearanceLevel!
    tags: [Tag!]!
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
    effectiveDate: DateTimeOrLocalDate
    status: ApplicationStatus
  }

  type Mutation {
    createAmendment(input: CreateAmendmentInput!): Amendment
    updateAmendment(id: ID!, input: UpdateAmendmentInput!): Amendment
    deleteAmendment(id: ID!): Amendment
  }

  type Query {
    amendments: [Amendment!]!
    amendment(id: ID!): Amendment
  }
`;

export interface Amendment {
  id: string;
  demonstration: Demonstration;
  name: NonEmptyString;
  description?: string;
  effectiveDate?: Date;
  status: ApplicationStatus;
  currentPhaseName: PhaseName;
  phases: ApplicationPhase[];
  documents: Document[];
  clearanceLevel: ClearanceLevel;
  createdAt: Date;
  updatedAt: Date;
  tags: Tag[];
}

export interface CreateAmendmentInput {
  demonstrationId: string;
  name: NonEmptyString;
  description: string | null;
}

export interface UpdateAmendmentInput {
  demonstrationId?: string;
  name?: NonEmptyString;
  description?: string | null;
  effectiveDate?: DateTimeOrLocalDate | null;
  status?: ApplicationStatus;
}
