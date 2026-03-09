import { gql } from "graphql-tag";
import { Document, PersonType, Event, Person } from "../../types.js";

export const userSchema = gql`
  type User {
    id: ID!
      @auth(
        permissions: [
          "View Current User"
          "View Application Workflow"
          "Manage Application Workflow"
          "View Demonstration Documents"
          "Manage Demonstration Documents"
          "View Application Documents"
          "Manage Application Documents"
          "Download Document"
        ]
      )
    cognitoSubject: String!
    username: String! @auth(permissions: ["View Current User"])
    person: Person!
      @auth(
        permissions: [
          "View Current User"
          "View Application Workflow"
          "Manage Application Workflow"
          "View Demonstration Documents"
          "Manage Demonstration Documents"
          "View Application Documents"
          "Manage Application Documents"
          "Download Document"
        ]
      )
    events: [Event!]!
    ownedDocuments: [Document!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Query {
    currentUser: User @auth(permissions: ["View Current User"])
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
  firstName: string;
  lastName: string;
}

export interface UpdateUserInput {
  personTypeId?: PersonType;
  cognitoSubject?: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}
