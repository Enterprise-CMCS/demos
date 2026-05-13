import { gql } from "graphql-tag";

import { Demonstration, Role } from "../../types";
import { Person } from "../person/personSchema";

export const demonstrationRoleAssignmentSchema = gql`
  type DemonstrationRoleAssignment {
    demonstration: Demonstration! @auth(requires: "Access Contact Demonstration")
    person: Person! @auth(requires: "Access Contact Person")
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
      @auth(requires: "Manage Demonstration Contacts")
    setDemonstrationRoles(input: [SetDemonstrationRoleInput!]!): [DemonstrationRoleAssignment!]!
      @auth(requires: "Manage Demonstration Contacts")
    unsetDemonstrationRoles(
      input: [UnsetDemonstrationRoleInput!]!
    ): [DemonstrationRoleAssignment!]! @auth(requires: "Manage Demonstration Contacts")
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
