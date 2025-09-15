import { gql } from "graphql-tag";
import { Person } from "@prisma/client";
import { Document, PersonType, Event } from "../../types.js";

export const userSchema = gql`
  type User {
    id: ID!
    cognitoSubject: String!
    username: String!
    person: Person!
    events: [Event!]!
    ownedDocuments: [Document!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Query {
    currentUser: User
  }
`;

export interface User {
  id: string;
  cognitoSubject: string;
  username: string;
  person: Person;
  events: Event[];
  ownedDocuments: Document[];
  createdAt: Date;
  updatedAt: Date;
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
