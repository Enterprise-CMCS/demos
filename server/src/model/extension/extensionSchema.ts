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
    createExtension(input: CreateExtensionInput!): Extension @auth(requires: "Mutate Modifications")
    updateExtension(id: ID!, input: UpdateExtensionInput!): Extension
      @auth(requires: "Mutate Modifications")
    deleteExtension(id: ID!): Extension @auth(requires: "Mutate Modifications")
  }

  type Query {
    extensions: [Extension!]! @auth(requires: "Query Modifications")
    extension(id: ID!): Extension @auth(requires: "Query Modifications")
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
