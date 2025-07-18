import { gql } from "graphql-tag";
import { Demonstration } from "../demonstration/demonstrationSchema.js";
import { User } from "../user/userSchema.js";

export const stateSchema = gql`
  type State {
    id: ID!
    stateCode: String!
    stateName: String!
    users: [User!]!
    demonstrations: [Demonstration!]!
  }

  input AddStateInput {
    stateCode: String!
    stateName: String!
    userIds: [ID!]
    demonstrationIds: [ID!]
  }

  input UpdateStateInput {
    stateCode: String
    stateName: String
    userIds: [ID!]
    demonstrationIds: [ID!]
  }

  type Mutation {
    addState(input: AddStateInput!): State
    updateState(input: UpdateStateInput!): State
    deleteState(id: ID!): State
  }

  type Query {
    states: [State]!
    state(id: ID!): State
  }
`;

export interface State {
  id: string;
  stateCode: string;
  stateName: string;
  users: User[];
  demonstrations: Demonstration[];
}

export interface AddStateInput {
  stateCode: string;
  stateName: string;
  userIds?: string[];
  demonstrationIds?: string[];
}

export interface UpdateStateInput {
  stateCode?: string;
  stateName?: string;
  userIds?: string[];
  demonstrationIds?: string[];
}
