import { gql } from "graphql-tag";
import { Event } from "../event/eventSchema.js";
import { Document } from "../document/documentSchema.js";
import { Person } from "../person/personSchema.js";

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
