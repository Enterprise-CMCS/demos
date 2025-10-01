import { gql } from "graphql-tag";
import { Document } from "../document/documentSchema.js";
import { Amendment, Extension } from "../modification/modificationSchema.js";
import { State } from "../state/stateSchema.js";
import {
  SdgDivision,
  SignatureLevel,
  PhaseName,
  BundlePhase,
  BundleStatus,
  DemonstrationRoleAssignment,
} from "../../types.js";

export const demonstrationSchema = gql`
  type Demonstration {
    id: ID!
    name: String!
    description: String!
    effectiveDate: Date
    expirationDate: Date
    sdgDivision: SdgDivision
    signatureLevel: SignatureLevel
    status: BundleStatus!
    state: State!
    currentPhaseName: PhaseName!
    phases: [BundlePhase!]!
    documents: [Document!]!
    amendments: [Amendment!]!
    extensions: [Extension!]!
    createdAt: DateTime!
    updatedAt: DateTime!
    roles: [DemonstrationRoleAssignment!]!
  }

  input CreateDemonstrationInput {
    name: String!
    stateId: ID!
    projectOfficerUserId: String!
    description: String
    sdgDivision: SdgDivision
    signatureLevel: SignatureLevel
  }

  input UpdateDemonstrationInput {
    name: String
    description: String
    effectiveDate: Date
    expirationDate: Date
    sdgDivision: SdgDivision
    signatureLevel: SignatureLevel
    status: BundleStatus
    currentPhaseName: PhaseName
    stateId: ID
  }

  type CreateDemonstrationResponse {
    success: Boolean!
    message: String
  }

  type Mutation {
    createDemonstration(input: CreateDemonstrationInput!): CreateDemonstrationResponse
    updateDemonstration(id: ID!, input: UpdateDemonstrationInput!): Demonstration
    deleteDemonstration(id: ID!): Demonstration
  }

  type Query {
    demonstrations: [Demonstration!]!
    demonstration(id: ID!): Demonstration
  }
`;

export interface Demonstration {
  id: string;
  name: string;
  description: string;
  effectiveDate: Date | null;
  expirationDate: Date | null;
  sdgDivision?: SdgDivision;
  signatureLevel?: SignatureLevel;
  status: BundleStatus;
  state: State;
  currentPhaseName: PhaseName;
  phases: BundlePhase[];
  documents: Document[];
  amendments: Amendment[];
  extensions: Extension[];
  createdAt: Date;
  updatedAt: Date;
  roles: DemonstrationRoleAssignment[];
}

// Used in creating a demonstration from the F/E dialog.
// The fields here should match the fields in that dialog.
export interface CreateDemonstrationInput {
  name: string;
  projectOfficerUserId: string;
  stateId: string;
  description?: string;
  sdgDivision?: SdgDivision;
  signatureLevel?: SignatureLevel;
}

export interface UpdateDemonstrationInput {
  name?: string;
  description?: string;
  effectiveDate?: Date;
  expirationDate?: Date;
  sdgDivision?: SdgDivision;
  signatureLevel?: SignatureLevel;
  status?: BundleStatus;
  currentPhaseName?: PhaseName;
  stateId?: string;
}
