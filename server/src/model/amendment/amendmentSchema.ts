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
  SignatureLevel,
} from "../../types.js";

export const amendmentSchema = gql`
  type Amendment {
    id: ID! @auth(requires: "Resolve Modification")
    demonstration: Demonstration! @auth(requires: "Resolve Modification Demonstration")
    name: NonEmptyString! @auth(requires: "Resolve Modification")
    description: String @auth(requires: "Resolve Modification")
    effectiveDate: DateTime @auth(requires: "Resolve Modification")
    status: ApplicationStatus! @auth(requires: "Resolve Modification Application Workflow")
    currentPhaseName: PhaseName! @auth(requires: "Resolve Modification Application Workflow")
    phases: [ApplicationPhase!]! @auth(requires: "Resolve Modification Application Workflow")
    documents: [Document!]! @auth(requires: "Resolve Modification Documents")
    clearanceLevel: ClearanceLevel! @auth(requires: "Resolve Modification Application Workflow")
    tags: [Tag!]! @auth(requires: "Resolve Modification Application Workflow")
    signatureLevel: SignatureLevel @auth(requires: "Resolve Modification")
    createdAt: DateTime! @auth(requires: "Resolve Modification")
    updatedAt: DateTime! @auth(requires: "Resolve Modification")
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
    createAmendment(input: CreateAmendmentInput!): Amendment @auth(requires: "Mutate Modifications")
    updateAmendment(id: ID!, input: UpdateAmendmentInput!): Amendment
      @auth(requires: "Mutate Modifications")
    deleteAmendment(id: ID!): Amendment @auth(requires: "Mutate Modifications")
  }

  type Query {
    amendments: [Amendment!]! @auth(requires: "Query Modifications")
    amendment(id: ID!): Amendment @auth(requires: "Query Modifications")
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
