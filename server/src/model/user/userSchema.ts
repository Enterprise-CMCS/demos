import { gql } from "graphql-tag";
import { Deliverable, Document, PersonType, Person, Permission, SystemRole } from "../../types.js";

export const userSchema = gql`
  type User {
    id: ID!
    cognitoSubject: String!
    username: String!
    person: Person!
    ownedDocuments: [Document!]!
    ownedDeliverables: [Deliverable!]!
    systemRoles: [SystemRole!]!
    permissions: [Permission!]!
    lastLogin: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Query {
    currentUser: User!
  }
`;

export interface User {
  id: string;
  cognitoSubject: string;
  username: string;
  person: Person;
  ownedDocuments: Document[];
  ownedDeliverables: Deliverable[];
  systemRoles: SystemRole[];
  permissions: Permission[];
  lastLogin: Date | null;
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
