import { gql } from "graphql-tag";
import { Document, PersonType, Event, Person } from "../../types.js";

export const userSchema = gql`
  type User {
    id: ID! @auth(requires: "Resolve User")
    cognitoSubject: String! @auth(requires: "Resolve User")
    username: String! @auth(requires: "Resolve User")
    person: Person! @auth(requires: "Resolve User Person")
    events: [Event!]!
    ownedDocuments: [Document!]! @auth(requires: "Resolve User Documents")
    createdAt: DateTime! @auth(requires: "Resolve User")
    updatedAt: DateTime! @auth(requires: "Resolve User")
  }

  type Query {
    currentUser: User @auth(requires: "Get Current User")
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
