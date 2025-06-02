import { gql } from "graphql-tag";
import { DemonstrationStatus } from "../demonstrationStatus/demonstrationStatusSchema";
import { State } from "../state/stateSchema";
import { User } from "../user/userSchema";

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
  }

  input AddDemonstrationInput {
    name: String!
    description: String!
    evaluationPeriodStartDate: Date!
    evaluationPeriodEndDate: Date!
    demonstrationStatusId: ID!
    stateId: ID!
    userIds: [ID!]
  }

  input UpdateDemonstrationInput {
    name: String
    description: String
    evaluationPeriodStartDate: Date
    evaluationPeriodEndDate: Date
    demonstrationStatusId: ID
    stateId: ID
    userIds: [ID!]
  }

  type Mutation {
    addDemonstration(input: AddDemonstrationInput!): Demonstration
    updateDemonstration(input: UpdateDemonstrationInput!): Demonstration
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
}

export interface AddDemonstrationInput {
  name: string;
  description: string;
  evaluationPeriodStartDate: Date;
  evaluationPeriodEndDate: Date;
  demonstrationStatusId: string;
  stateId: string;
  userIds?: string[];
}

export interface UpdateDemonstrationInput {
  name?: string;
  description?: string;
  evaluationPeriodStartDate?: Date;
  evaluationPeriodEndDate?: Date;
  demonstrationStatusId?: string;
  stateId?: string;
  userIds?: string[];
}
