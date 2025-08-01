import { gql } from "graphql-tag";
import { State } from "../state/stateSchema.js";
import { Role } from "../role/roleSchema.js";
import { Demonstration } from "../demonstration/demonstrationSchema.js";
import { Event } from "../event/eventSchema.js";
import { Document } from "../document/documentSchema.js";

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
    events: [Event!]!
    ownedDocuments: [Document!]!
  }

  input CreateUserInput {
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
    createUser(input: CreateUserInput!): User
    updateUser(id: ID!, input: UpdateUserInput!): User
    deleteUser(id: ID!): User
  }

  type Query {
    users: [User!]!
    user(id: ID!): User
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
  events: Event[];
  ownedDocuments: Document[];
}

export interface CreateUserInput {
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
