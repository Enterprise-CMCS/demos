import { gql } from "graphql-tag";
import { Event } from "../event/eventSchema.js";
import { Document } from "../document/documentSchema.js";
import { PersonType } from "../../types.js";

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
  }

  input UpdateUserInput {
    personTypeId: PersonType
    cognitoSubject: String
    username: String
    email: String
    fullName: String
    displayName: String
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
}

export interface UpdateUserInput {
  personTypeId?: PersonType;
  cognitoSubject?: string;
  username?: string;
  email?: string;
  fullName?: string;
  displayName?: string;
}
