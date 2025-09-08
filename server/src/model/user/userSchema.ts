import { gql } from "graphql-tag";
import { State } from "../state/stateSchema.js";
import { Role } from "../role/roleSchema.js";
import { Demonstration } from "../demonstration/demonstrationSchema.js";
import { Event } from "../event/eventSchema.js";
import { Document } from "../document/documentSchema.js";
import { PersonType } from "../personType/personTypeSchema.js";

export const userSchema = gql`
  type User {
    id: ID!
    personTypeId: PersonType!
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
    personTypeId: PersonType!
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
    personTypeId: PersonType
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
    currentUser: User
  }
`;

export interface User {
  id: string;
  personTypeId: PersonType;
  cognitoSubject: string;
  username: string;
  email: string;
  fullName: string;
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
  states: State[];
  roles: Role[];
  demonstrations: Demonstration[];
  events: Event[];
  ownedDocuments: Document[];
}

export interface CreateUserInput {
  personTypeId: PersonType;
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
  personTypeId?: PersonType;
  cognitoSubject?: string;
  username?: string;
  email?: string;
  fullName?: string;
  displayName?: string;
  stateIds?: string[];
  roleIds?: string[];
  demonstrationIds?: string[];
}
