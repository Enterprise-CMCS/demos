import { gql } from "graphql-tag";

import { DemonstrationRoleAssignment, PersonType, State } from "../../types";

export const personSchema = gql`
  type Person {
    id: ID!
      @auth(
        permissions: [
          "View Current User"
          "List People"
          "List Demonstrations"
          "Manage Demonstrations"
          "List Applications"
          "Manage Applications"
          "View Demonstration Details"
          "Manage Demonstration Details"
          "View Application Details"
          "Manage Application Details"
          "View Demonstration Contacts"
          "Manage Demonstration Contacts"
          "View Application Workflow"
          "Manage Application Workflow"
          "View Demonstration Documents"
          "Manage Demonstration Documents"
          "View Application Documents"
          "Manage Application Documents"
          "Download Document"
        ]
      )
    personType: PersonType!
      @auth(
        permissions: [
          "View Current User"
          "List People"
          "View Demonstration Contacts"
          "Manage Demonstration Contacts"
        ]
      )
    email: String!
      @auth(
        permissions: [
          "View Current User"
          "View Demonstration Contacts"
          "Manage Demonstration Contacts"
        ]
      )
    firstName: String! @auth(permissions: ["View Current User", "List People"])
    lastName: String! @auth(permissions: ["View Current User", "List People"])
    # FullName is a computed field (not stored in DB)
    fullName: String!
      @auth(
        permissions: [
          "View Current User"
          "List People"
          "List Demonstrations"
          "Manage Demonstrations"
          "List Applications"
          "Manage Applications"
          "View Demonstration Details"
          "Manage Demonstration Details"
          "View Application Details"
          "Manage Application Details"
          "View Demonstration Contacts"
          "Manage Demonstration Contacts"
          "View Application Workflow"
          "Manage Application Workflow"
          "View Demonstration Documents"
          "Manage Demonstration Documents"
          "View Application Documents"
          "Manage Application Documents"
          "Download Document"
        ]
      )
    createdAt: DateTime!
    updatedAt: DateTime!
    states: [State!]!
    roles: [DemonstrationRoleAssignment!]!
  }
  type Query {
    person(id: ID!): Person @auth(permissions: ["List People"])
    people: [Person!]! @auth(permissions: ["List People"])
    searchPeople(search: String!, demonstrationId: ID): [Person!]!
      @auth(permissions: ["List People"])
  }
`;

export interface Person {
  id: string;
  personType: PersonType;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  createdAt: Date;
  updatedAt: Date;
  roles: DemonstrationRoleAssignment[];
  states: State[];
}
