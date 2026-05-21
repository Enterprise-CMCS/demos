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
  AmendmentSignatureLevel,
} from "../../types.js";

export const amendmentSchema = gql`
  type Amendment {
    id: ID!
    demonstration: Demonstration!
    name: NonEmptyString!
    description: String
    effectiveDate: DateTime
    status: ApplicationStatus!
    currentPhaseName: PhaseName! @auth(requires: ["Access CMS Field"])
    phases: [ApplicationPhase!]! @auth(requires: ["Access CMS Field"])
    documents: [Document!]! @auth(requires: ["Access CMS Field"])
    clearanceLevel: ClearanceLevel! @auth(requires: ["Access CMS Field"])
    tags: [Tag!]! @auth(requires: ["Access CMS Field"])
    signatureLevel: AmendmentSignatureLevel
    suggestedApplicationTags: [TagName!]! @auth(requires: ["Access CMS Field"])
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CreateAmendmentInput {
    demonstrationId: ID!
    name: NonEmptyString!
    description: String
    signatureLevel: AmendmentSignatureLevel
  }

  input UpdateAmendmentInput {
    demonstrationId: ID
    name: NonEmptyString
    description: String
    effectiveDate: DateTimeOrLocalDate
    status: ApplicationStatus
    signatureLevel: AmendmentSignatureLevel
  }

  type Mutation {
    createAmendment(input: CreateAmendmentInput!): Amendment! @auth(requires: ["Perform CMS Action"])
    updateAmendment(id: ID!, input: UpdateAmendmentInput!): Amendment!
      @auth(requires: ["Perform CMS Action"])
    deleteAmendment(id: ID!): Amendment! @auth(requires: ["Perform CMS Action"])
  }

  type Query {
    amendments: [Amendment!]! @auth(requires: ["Access CMS Query"])
    amendment(id: ID!): Amendment! @auth(requires: ["Access CMS Query"])
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
  signatureLevel?: AmendmentSignatureLevel;
  suggestedApplicationTags: TagName[];
  updatedAt: Date;
  createdAt: Date;
}

export interface CreateAmendmentInput {
  demonstrationId: string;
  name: NonEmptyString;
  description: string | null;
  signatureLevel?: AmendmentSignatureLevel;
}

export interface UpdateAmendmentInput {
  demonstrationId?: string;
  name?: NonEmptyString;
  description?: string | null;
  effectiveDate?: DateTimeOrLocalDate | null;
  status?: ApplicationStatus;
  signatureLevel?: AmendmentSignatureLevel;
}
