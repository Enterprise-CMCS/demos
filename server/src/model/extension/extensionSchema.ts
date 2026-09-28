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
  ExtensionSignatureLevel,
} from "../../types.js";

export const extensionSchema = gql`
  type Extension {
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
    signatureLevel: ExtensionSignatureLevel
    suggestedApplicationTags: [TagName!]! @auth(requires: ["Access CMS Field"])
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CreateExtensionInput {
    demonstrationId: ID!
    name: NonEmptyString!
    description: String
    signatureLevel: ExtensionSignatureLevel
  }

  input UpdateExtensionInput {
    demonstrationId: ID
    name: NonEmptyString
    description: String
    effectiveDate: DateTimeOrLocalDate
    signatureLevel: ExtensionSignatureLevel
  }

  type Mutation {
    createExtension(input: CreateExtensionInput!): Extension!
      @auth(requires: ["Modify Applications"])
    updateExtension(id: ID!, input: UpdateExtensionInput!): Extension!
      @auth(requires: ["Modify Applications"])
    deleteExtension(id: ID!): Extension! @auth(requires: ["Modify Applications"])
  }

  type Query {
    extension(id: ID!): Extension! @auth(requires: ["Access CMS Query"])
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
  signatureLevel?: ExtensionSignatureLevel;
  suggestedApplicationTags: TagName[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExtensionInput {
  demonstrationId: string;
  name: NonEmptyString;
  description: string | null;
  signatureLevel?: ExtensionSignatureLevel;
}

export interface UpdateExtensionInput {
  demonstrationId?: string;
  name?: NonEmptyString;
  description?: string | null;
  effectiveDate?: DateTimeOrLocalDate | null;
  signatureLevel?: ExtensionSignatureLevel | null;
}
