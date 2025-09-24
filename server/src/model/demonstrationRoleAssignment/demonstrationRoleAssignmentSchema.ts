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

  input AssignDemonstrationRoleInput {
    demonstrationId: ID!
    personId: ID!
    roleId: Role!
    isPrimary: Boolean
  }

  input UnassignDemonstrationRoleInput {
    demonstrationId: ID!
    personId: ID!
    roleId: Role!
  }

  type Mutation {
    assignDemonstrationRole(input: AssignDemonstrationRoleInput!): DemonstrationRoleAssignment!
    unassignDemonstrationRole(input: UnassignDemonstrationRoleInput!): DemonstrationRoleAssignment!
  }
`;

export type DemonstrationRoleAssignment = {
  demonstration: Demonstration;
  person: Person;
  role: Role;
  isPrimary: boolean;
};

export type AssignDemonstrationRoleInput = {
  demonstrationId: string;
  personId: string;
  roleId: Role;
  isPrimary?: boolean;
};

export type UnassignDemonstrationRoleInput = {
  demonstrationId: string;
  personId: string;
  roleId: Role;
};
