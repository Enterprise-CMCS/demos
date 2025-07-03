import { gql } from "graphql-tag";
import { State } from "../state/stateSchema.js";
import { Role } from "../role/roleSchema.js";
import { Demonstration } from "../demonstration/demonstrationSchema.js";

export const userSchema = gql`
  type User {
    id: ID!
    cognitoSubject: String!
    username: String!
    email: String!
    fullName: String!
    displayName: String!
    createdAt: DateTime!
    updatedAt: DateTime!
    states: [State!]!
    roles: [Role!]!
    demonstrations: [Demonstration!]!
  }

  input AddUserInput {
    cognitoSubject: String!
    username: String!
    email: String!
    fullName: String!
    displayName: String!
    stateIds: [ID!]
    roleIds: [ID!]
    demonstrationIds: [ID!]
  }

  input UpdateUserInput {
    cognitoSubject: String
    username: String
    email: String
    fullName: String
    displayName: String
    stateIds: [ID!]
    roleIds: [ID!]
    demonstrationIds: [ID!]
  }

  type Mutation {
    addUser(input: AddUserInput!): User
    updateUser(input: UpdateUserInput!): User
    deleteUser(id: ID!): User
  }

  type Query {
    users: [User]!
    user(id: Int!): User
  }
`;

export type DateTime = Date;
export interface User {
  id: string;
  cognitoSubject: string;
  username: string;
  email: string;
  fullName: string;
  displayName: string;
  createdAt: DateTime;
  updatedAt: DateTime;
  states: State[];
  roles: Role[];
  demonstrations: Demonstration[];
}

export interface AddUserInput {
  cognitoSubject: string;
  username: string;
  email: string;
  fullName: string;
  displayName: string;
  stateIds?: string[];
  roleIds?: string[];
  demonstrationIds?: string[];
}

export interface UpdateUserInput {
  cognitoSubject?: string;
  username?: string;
  email?: string;
  fullName?: string;
  displayName?: string;
  stateIds?: string[];
  roleIds?: string[];
  demonstrationIds?: string[];
}
