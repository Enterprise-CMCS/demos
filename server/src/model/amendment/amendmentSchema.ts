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
    id: ID!
      @auth(
        permissions: [
          "List Applications"
          "Manage Applications"
          "View Application Details"
          "Manage Application Details"
          "View Application Workflow"
          "Manage Application Workflow"
          "View Application Workflow"
          "Manage Application Workflow"
          "View Application Documents"
          "Manage Application Documents"
        ]
      )
    demonstration: Demonstration!
      @auth(
        permissions: ["View Application Details", "Manage Application Details", "Download Document"]
      )
    name: NonEmptyString!
      @auth(
        permissions: [
          "List Applications"
          "Manage Applications"
          "View Application Details"
          "Manage Application Details"
          "Download Document"
        ]
      )
    description: String
      @auth(permissions: ["View Application Details", "Manage Application Details"])
    effectiveDate: DateTime
      @auth(permissions: ["View Application Details", "Manage Application Details"])
    status: ApplicationStatus!
      @auth(
        permissions: [
          "List Applications"
          "Manage Applications"
          "View Application Details"
          "Manage Application Details"
          "View Application Workflow"
          "Manage Application Workflow"
        ]
      )
    currentPhaseName: PhaseName!
      @auth(permissions: ["View Application Workflow", "Manage Application Workflow"])
    phases: [ApplicationPhase!]!
      @auth(permissions: ["View Application Workflow", "Manage Application Workflow"])
    documents: [Document!]!
      @auth(
        permissions: [
          "View Application Workflow"
          "Manage Application Workflow"
          "View Application Documents"
          "Manage Application Documents"
        ]
      )
    clearanceLevel: ClearanceLevel!
      @auth(permissions: ["View Application Workflow", "Manage Application Workflow"])
    tags: [Tag!]! @auth(permissions: ["View Application Workflow", "Manage Application Workflow"])
    signatureLevel: SignatureLevel
      @auth(permissions: ["View Application Details", "Manage Application Details"])
    createdAt: DateTime! @auth(permissions: ["View Application Details", "Manage Application Details"])
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
      @auth(permissions: ["Manage Applications"])
    updateAmendment(id: ID!, input: UpdateAmendmentInput!): Amendment
      @auth(permissions: ["Manage Applications", "Manage Application Details"])
    deleteAmendment(id: ID!): Amendment @auth(permissions: ["Manage Applications"])
  }

  type Query {
    amendments: [Amendment!]! @auth(permissions: ["List Applications", "Manage Applications"])
    amendment(id: ID!): Amendment
      @auth(
        permissions: [
          "View Applications"
          "Manage Applications"
          "View Application Details"
          "Manage Application Details"
          "View Application Workflow"
          "Manage Application Workflow"
          "View Application Documents"
          "Manage Application Documents"
        ]
      )
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
