import { gql } from "graphql-tag";

import { Demonstration, Role } from "../../types";
import { Person } from "../person/personSchema";

export const demonstrationRoleAssignmentSchema = gql`
  type DemonstrationRoleAssignment {
    demonstration: Demonstration!
    person: Person!
      @auth(
        permissions: [
          "Manage Demonstration Details"
          "Manage Application Details"
          "View Demonstration Contacts"
          "Manage Demonstration Contacts"
        ]
      )
    role: Role!
      @auth(
        permissions: [
          "Manage Demonstration Details"
          "Manage Application Details"
          "View Demonstration Contacts"
          "Manage Demonstration Contacts"
        ]
      )
    isPrimary: Boolean!
      @auth(
        permissions: [
          "Manage Demonstration Details"
          "Manage Application Details"
          "View Demonstration Contacts"
          "Manage Demonstration Contacts"
        ]
      )
  }

  input SetDemonstrationRoleInput {
    demonstrationId: ID!
    personId: ID!
    roleId: Role!
    isPrimary: Boolean
  }

  input UnsetDemonstrationRoleInput {
    demonstrationId: ID!
    personId: ID!
    roleId: Role!
  }

  type Mutation {
    setDemonstrationRole(input: SetDemonstrationRoleInput!): DemonstrationRoleAssignment!
      @auth(permissions: ["Manage Demonstration Contacts"])
    setDemonstrationRoles(input: [SetDemonstrationRoleInput!]!): [DemonstrationRoleAssignment!]!
      @auth(permissions: ["Manage Demonstration Contacts"])
    unsetDemonstrationRoles(
      input: [UnsetDemonstrationRoleInput!]!
    ): [DemonstrationRoleAssignment!]! @auth(permissions: ["Manage Demonstration Contacts"])
  }
`;

export interface DemonstrationRoleAssignment {
  demonstration: Demonstration;
  person: Person;
  role: Role;
  isPrimary: boolean;
}

export interface SetDemonstrationRoleInput {
  demonstrationId: string;
  personId: string;
  roleId: Role;
  isPrimary?: boolean;
}

export interface UnsetDemonstrationRoleInput {
  demonstrationId: string;
  personId: string;
  roleId: Role;
}
