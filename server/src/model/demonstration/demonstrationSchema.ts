import { gql } from "graphql-tag";

import { DemonstrationStatus } from "../demonstrationStatus/demonstrationStatusSchema.js";
import { Document } from "../document/documentSchema.js";
import { Amendment, Extension } from "../modification/modificationSchema.js";
import { State } from "../state/stateSchema.js";
import { User } from "../user/userSchema.js";

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
    effectiveDate: Date!
    expirationDate: Date!
    cmcsDivision: CmcsDivision
    signatureLevel: SignatureLevel
    createdAt: DateTime!
    updatedAt: DateTime!
    demonstrationStatus: DemonstrationStatus!
    state: State!
    users: [User!]!
    projectOfficer: User!
    documents: [Document!]!
    amendments: [Amendment!]!
    extensions: [Extension!]!
  }

  input CreateDemonstrationInput {
    name: String!
    description: String!
    effectiveDate: Date!
    expirationDate: Date!
    cmcsDivision: CmcsDivision
    signatureLevel: SignatureLevel
    demonstrationStatusId: ID!
    stateId: ID!
    userIds: [ID!]
    projectOfficerUserId: String!
  }

  input UpdateDemonstrationInput {
    name: String
    description: String
    effectiveDate: Date
    expirationDate: Date
    cmcsDivision: CmcsDivision
    signatureLevel: SignatureLevel
    demonstrationStatusId: ID
    stateId: ID
    userIds: [ID!]
    projectOfficerUserId: String
  }

  type Mutation {
    createDemonstration(input: CreateDemonstrationInput!): Demonstration
    updateDemonstration(
      id: ID!
      input: UpdateDemonstrationInput!
    ): Demonstration
    deleteDemonstration(id: ID!): Demonstration
  }

  type Query {
    demonstrations: [Demonstration!]!
    demonstration(id: ID!): Demonstration
  }
`;

export type DateTime = Date;

// Note: If changing either of these, be sure to update the related DB table as well!
export const SIGNATURE_LEVEL = ["OA", "OCD", "OGD"] as const;
export type SignatureLevel = (typeof SIGNATURE_LEVEL)[number];

export const CMCS_DIVISION = [
  "Division of System Reform Demonstrations",
  "Division of Eligibility and Coverage Demonstrations",
] as const;
export type CmcsDivision = (typeof CMCS_DIVISION)[number];

export interface Demonstration {
  id: string;
  name: string;
  description: string;
  effectiveDate: Date;
  expirationDate: Date;
  cmcsDivision?: CmcsDivision;
  signatureLevel?: SignatureLevel;
  createdAt: DateTime;
  updatedAt: DateTime;
  demonstrationStatus: DemonstrationStatus;
  state: State;
  users: User[];
  projectOfficer: User;
  documents: Document[];
  amendments: Amendment[];
  extensions: Extension[];
}

export interface CreateDemonstrationInput {
  name: string;
  description: string;
  effectiveDate: Date;
  expirationDate: Date;
  cmcsDivision?: CmcsDivision;
  signatureLevel?: SignatureLevel;
  demonstrationStatusId: string;
  stateId: string;
  userIds?: string[];
  projectOfficerUserId: string;
}

export interface UpdateDemonstrationInput {
  name?: string;
  description?: string;
  effectiveDate?: Date;
  expirationDate?: Date;
  cmcsDivision?: CmcsDivision;
  signatureLevel?: SignatureLevel;
  demonstrationStatusId?: string;
  stateId?: string;
  userIds?: string[];
  projectOfficerUserId?: string;
}
