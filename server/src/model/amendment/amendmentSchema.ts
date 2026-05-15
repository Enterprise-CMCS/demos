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
    demonstration: Demonstration!
    name: NonEmptyString!
    description: String
    effectiveDate: DateTime
    status: ApplicationStatus!
    currentPhaseName: PhaseName! @auth(requires: "Access CMS-Only Fields")
    phases: [ApplicationPhase!]! @auth(requires: "Access CMS-Only Fields")
    documents: [Document!]! @auth(requires: "Access CMS-Only Fields")
    clearanceLevel: ClearanceLevel! @auth(requires: "Access CMS-Only Fields")
    tags: [Tag!]! @auth(requires: "Access CMS-Only Fields")
    signatureLevel: SignatureLevel
    suggestedApplicationTags: [TagName!]! @auth(requires: "Access CMS-Only Fields")
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
    createAmendment(input: CreateAmendmentInput!): Amendment
      @auth(requires: "Access CMS-Only Mutations")
    updateAmendment(id: ID!, input: UpdateAmendmentInput!): Amendment
      @auth(requires: "Access CMS-Only Mutations")
    deleteAmendment(id: ID!): Amendment @auth(requires: "Access CMS-Only Mutations")
  }

  type Query {
    amendments: [Amendment!]! @auth(requires: "Access CMS-Only Queries")
    amendment(id: ID!): Amendment @auth(requires: "Access CMS-Only Queries")
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
