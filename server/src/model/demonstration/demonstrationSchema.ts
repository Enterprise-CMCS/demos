import { gql } from "graphql-tag";
import { DemonstrationStatus } from "../demonstrationStatus/demonstrationStatusSchema.js";
import { Document } from "../document/documentSchema.js";
import { Amendment, Extension } from "../modification/modificationSchema.js";
import { State } from "../state/stateSchema.js";
import { User } from "../user/userSchema.js";
import { CmcsDivision } from "../cmcsDivision/cmcsDivisionSchema.js";
import { SignatureLevel } from "../signatureLevel/signatureLevelSchema.js";
import { Contact } from "../contact/contactSchema.js";

export const demonstrationSchema = gql`
  type Demonstration {
    id: ID!
    name: String!
    description: String!
    effectiveDate: Date
    expirationDate: Date
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
    contacts: [Contact!]!
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
  effectiveDate?: Date;
  expirationDate?: Date;
  cmcsDivision?: CmcsDivision;
  signatureLevel?: SignatureLevel;
  createdAt: Date;
  updatedAt: Date;
  demonstrationStatus: DemonstrationStatus;
  state: State;
  users: User[];
  projectOfficer: User;
  documents: Document[];
  amendments: Amendment[];
  extensions: Extension[];
  contacts: Contact[];
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
