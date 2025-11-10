import { gql } from "graphql-tag";

import { Demonstration, Role } from "../../types";
import { Person } from "../person/personSchema";

export const demonstrationRoleAssignmentSchema = gql`
  type DemonstrationRoleAssignment {
    demonstration: Demonstration!
    person: Person!
    role: Role!
    isPrimary: Boolean!
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
    setDemonstrationRoles(input: [SetDemonstrationRoleInput!]!): [DemonstrationRoleAssignment!]!
    unsetDemonstrationRoles(input: [UnsetDemonstrationRoleInput!]!): [DemonstrationRoleAssignment!]!
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
