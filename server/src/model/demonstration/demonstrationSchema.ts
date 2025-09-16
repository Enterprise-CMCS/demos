import { gql } from "graphql-tag";
import { DemonstrationStatus } from "../demonstrationStatus/demonstrationStatusSchema.js";
import { Document } from "../document/documentSchema.js";
import { Amendment, Extension } from "../modification/modificationSchema.js";
import { State } from "../state/stateSchema.js";
import {
  CmcsDivision,
  SignatureLevel,
  Phase,
  Role,
  DemonstrationRoleAssignment,
} from "../../types.js";

export const demonstrationSchema = gql`
  """
  A string representing a CMCS division. Expected values are:
  - Division of System Reform Demonstrations
  - Division of Eligibility and Coverage Demonstrations
  """
  scalar CmcsDivision
  """
  A string representing a signature level. Expected values are:
  - OA
  - OCD
  - OGD
  """
  scalar SignatureLevel
  type Demonstration {
    id: ID!
    name: String!
    description: String!
    effectiveDate: Date
    expirationDate: Date
    cmcsDivision: CmcsDivision
    signatureLevel: SignatureLevel
    demonstrationStatus: DemonstrationStatus!
    state: State!
    currentPhase: Phase!
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
    cmcsDivision: CmcsDivision
    signatureLevel: SignatureLevel
  }

  input UpdateDemonstrationInput {
    name: String
    description: String
    effectiveDate: Date
    expirationDate: Date
    cmcsDivision: CmcsDivision
    signatureLevel: SignatureLevel
    demonstrationStatusId: ID
    currentPhase: Phase
    stateId: ID
  }

  input AddPeopleToDemonstrationInput {
    personId: ID!
    role: Role!
    isPrimary: Boolean
  }

  input RemovePeopleFromDemonstrationInput {
    personId: ID!
    role: Role!
  }

  type CreateDemonstrationResponse {
    success: Boolean!
    message: String
  }

  type Mutation {
    createDemonstration(input: CreateDemonstrationInput!): CreateDemonstrationResponse
    updateDemonstration(id: ID!, input: UpdateDemonstrationInput!): Demonstration
    addPeopleToDemonstration(
      id: ID!
      demonstrationAssignments: [AddPeopleToDemonstrationInput!]!
    ): Demonstration
    removePeopleFromDemonstration(
      id: ID!
      input: [RemovePeopleFromDemonstrationInput!]!
    ): Demonstration
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
  cmcsDivision?: CmcsDivision;
  signatureLevel?: SignatureLevel;
  demonstrationStatus: DemonstrationStatus;
  state: State;
  currentPhase: Phase;
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
  cmcsDivision?: CmcsDivision;
  signatureLevel?: SignatureLevel;
}

export interface UpdateDemonstrationInput {
  name?: string;
  description?: string;
  effectiveDate?: Date;
  expirationDate?: Date;
  cmcsDivision?: CmcsDivision;
  signatureLevel?: SignatureLevel;
  demonstrationStatusId?: string;
  currentPhase?: Phase;
  stateId?: string;
}

export interface AddPeopleToDemonstrationInput {
  personId: string;
  role: Role;
  isPrimary?: boolean;
}

export interface RemovePeopleFromDemonstrationInput {
  personId: string;
  role: Role;
}
