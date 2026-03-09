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

export const extensionSchema = gql`
  type Extension {
    id: ID!
      @auth(
        permissions: [
          "List Applications"
          "Manage Applications"
          "View Application Details"
          "Manage Application Details"
          "View Application Workflow"
          "Manage Application Workflow"
          "View Application Documents"
          "Manage Application Documents"
          "Download Document"
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
    createdAt: DateTime!
      @auth(permissions: ["View Application Details", "Manage Application Details"])
    updatedAt: DateTime!
  }

  input CreateExtensionInput {
    demonstrationId: ID!
    name: NonEmptyString!
    description: String
    signatureLevel: SignatureLevel
  }

  input UpdateExtensionInput {
    demonstrationId: ID
    name: NonEmptyString
    description: String
    effectiveDate: DateTimeOrLocalDate
    status: ApplicationStatus
    signatureLevel: SignatureLevel
  }

  type Mutation {
    createExtension(input: CreateExtensionInput!): Extension
      @auth(permissions: ["Manage Applications"])
    updateExtension(id: ID!, input: UpdateExtensionInput!): Extension
      @auth(permissions: ["Manage Applications", "Manage Application Details"])
    deleteExtension(id: ID!): Extension @auth(permissions: ["Manage Applications"])
  }

  type Query {
    extensions: [Extension!]! @auth(permissions: ["List Applications", "Manage Applications"])
    extension(id: ID!): Extension
      @auth(
        permissions: [
          "List Applications"
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

export interface Extension {
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
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExtensionInput {
  demonstrationId: string;
  name: NonEmptyString;
  description: string | null;
  signatureLevel?: SignatureLevel;
}

export interface UpdateExtensionInput {
  demonstrationId?: string;
  name?: NonEmptyString;
  description?: string | null;
  effectiveDate?: DateTimeOrLocalDate | null;
  status?: ApplicationStatus;
  signatureLevel?: SignatureLevel;
}
