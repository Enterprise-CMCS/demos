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
  TagName,
  SignatureLevel,
} from "../../types.js";

export const amendmentSchema = gql`
  type Amendment {
    id: ID!
    demonstration: Demonstration! @auth(requires: "Access Modification Demonstration")
    name: NonEmptyString!
    description: String
    effectiveDate: DateTime
    status: ApplicationStatus!
    currentPhaseName: PhaseName! @auth(requires: "Access Application Workflow")
    phases: [ApplicationPhase!]! @auth(requires: "Access Application Workflow")
    documents: [Document!]! @auth(requires: "Access Application Documents")
    clearanceLevel: ClearanceLevel! @auth(requires: "Access Application Workflow")
    tags: [Tag!]! @auth(requires: "Access Application Workflow")
    signatureLevel: SignatureLevel
    suggestedApplicationTags: [TagName!]! @auth(requires: "Access Application Workflow")
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CreateAmendmentInput {
    demonstrationId: ID!
    name: NonEmptyString!
    description: String
    signatureLevel: SignatureLevel
  }

  input UpdateAmendmentInput {
    demonstrationId: ID
    name: NonEmptyString
    description: String
    effectiveDate: DateTimeOrLocalDate
    status: ApplicationStatus
    signatureLevel: SignatureLevel
  }

  type Mutation {
    createAmendment(input: CreateAmendmentInput!): Amendment @auth(requires: "Create Modification")
    updateAmendment(id: ID!, input: UpdateAmendmentInput!): Amendment @auth(requires: "Manage Modification")
    deleteAmendment(id: ID!): Amendment @auth(requires: "Delete Modification")
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
  tags: Tag[];
  signatureLevel?: SignatureLevel;
  suggestedApplicationTags: TagName[];
  updatedAt: Date;
  createdAt: Date;
}

export interface CreateAmendmentInput {
  demonstrationId: string;
  name: NonEmptyString;
  description: string | null;
  signatureLevel?: SignatureLevel;
}

export interface UpdateAmendmentInput {
  demonstrationId?: string;
  name?: NonEmptyString;
  description?: string | null;
  effectiveDate?: DateTimeOrLocalDate | null;
  status?: ApplicationStatus;
  signatureLevel?: SignatureLevel;
}
