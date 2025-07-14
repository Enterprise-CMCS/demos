import { gql } from "graphql-tag";
import { DemonstrationStatus } from "../demonstrationStatus/demonstrationStatusSchema.js";
import { State } from "../state/stateSchema.js";
import { User } from "../user/userSchema.js";

export const demonstrationSchema = gql`
  type Demonstration {
    id: ID!
    name: String!
    description: String!
    evaluationPeriodStartDate: Date!
    evaluationPeriodEndDate: Date!
    createdAt: DateTime!
    updatedAt: DateTime!
    demonstrationStatus: DemonstrationStatus!
    state: State!
    users: [User!]!
    projectOfficerUser: User!
  }

  input AddDemonstrationInput {
    name: String!
    description: String!
    evaluationPeriodStartDate: Date!
    evaluationPeriodEndDate: Date!
    demonstrationStatusId: ID!
    stateId: ID!
    userIds: [ID!]
    projectOfficerUserId: String!
  }

  input UpdateDemonstrationInput {
    name: String
    description: String
    evaluationPeriodStartDate: Date
    evaluationPeriodEndDate: Date
    demonstrationStatusId: ID
    stateId: ID
    userIds: [ID!]
    projectOfficerUserId: String
  }

  type Mutation {
    addDemonstration(input: AddDemonstrationInput!): Demonstration
    updateDemonstration(id: ID!, input: UpdateDemonstrationInput!): Demonstration
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
  evaluationPeriodStartDate: Date;
  evaluationPeriodEndDate: Date;
  createdAt: DateTime;
  updatedAt: DateTime;
  demonstrationStatus: DemonstrationStatus;
  state: State;
  users: User[];
  projectOfficerUser: User;
}

export interface AddDemonstrationInput {
  name: string;
  description: string;
  evaluationPeriodStartDate: Date;
  evaluationPeriodEndDate: Date;
  demonstrationStatusId: string;
  stateId: string;
  userIds?: string[];
  projectOfficerUserId: string;
}

export interface UpdateDemonstrationInput {
  name?: string;
  description?: string;
  evaluationPeriodStartDate?: Date;
  evaluationPeriodEndDate?: Date;
  demonstrationStatusId?: string;
  stateId?: string;
  userIds?: string[];
  projectOfficerUserId?: string;
}
