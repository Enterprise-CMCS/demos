import { gql } from "graphql-tag";
import { Deliverable, Document, PersonType, Event, Person } from "../../types.js";

export const userSchema = gql`
  type User {
    id: ID!
    cognitoSubject: String!
    username: String!
    person: Person!
    events: [Event!]!
    ownedDocuments: [Document!]!
    ownedDeliverables: [Deliverable!]!
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
  ownedDeliverables: Deliverable[];
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
