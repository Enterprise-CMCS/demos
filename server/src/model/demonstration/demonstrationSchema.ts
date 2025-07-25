import { gql } from "graphql-tag";
import { DemonstrationStatus } from "../demonstrationStatus/demonstrationStatusSchema.js";
import { State } from "../state/stateSchema.js";
import { User } from "../user/userSchema.js";
import { Document } from "../document/documentSchema.js";
import { Amendment } from "../modification/modificationSchema.js";

export const demonstrationSchema = gql`
  type Demonstration {
    id: ID!
    name: String!
    description: String!
    effectiveDate: Date!
    expirationDate: Date!
    createdAt: DateTime!
    updatedAt: DateTime!
    demonstrationStatus: DemonstrationStatus!
    state: State!
    users: [User!]!
    projectOfficer: User!
    documents: [Document!]!
    amendments: [Amendment!]!
  }

  input AddDemonstrationInput {
    name: String!
    description: String!
    effectiveDate: Date!
    expirationDate: Date!
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
    demonstrationStatusId: ID
    stateId: ID
    userIds: [ID!]
    projectOfficerUserId: String
  }

  type Mutation {
    addDemonstration(input: AddDemonstrationInput!): Demonstration
    updateDemonstration(
      id: ID!
      input: UpdateDemonstrationInput!
    ): Demonstration
    deleteDemonstration(id: ID!): Demonstration
  }

  type Query {
    demonstrations: [Demonstration]!
    demonstration(id: ID!): Demonstration
  }
`;

export type DateTime = Date;
export interface Demonstration {
  id: string;
  name: string;
  description: string;
  effectiveDate: Date;
  expirationDate: Date;
  createdAt: DateTime;
  updatedAt: DateTime;
  demonstrationStatus: DemonstrationStatus;
  state: State;
  users: User[];
  projectOfficer: User;
  documents: Document[];
  amendments: Amendment[];
}

export interface AddDemonstrationInput {
  name: string;
  description: string;
  effectiveDate: Date;
  expirationDate: Date;
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
  demonstrationStatusId?: string;
  stateId?: string;
  userIds?: string[];
  projectOfficerUserId?: string;
}
