import { gql } from "graphql-tag";

import { Demonstration, Role } from "../../types";
import { Person } from "../person/personSchema";

export const demonstrationRoleAssignmentSchema = gql`
  type DemonstrationRoleAssignment {
    demonstration: Demonstration! @auth(requires: "Resolve DemonstrationRoleAssignmentDocument")
    person: Person! @auth(requires: "Resolve DemonstrationRoleAssignment")
    role: Role! @auth(requires: "Resolve DemonstrationRoleAssignment")
    isPrimary: Boolean! @auth(requires: "Resolve DemonstrationRoleAssignment")
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
      @auth(requires: "Mutate Demonstration Contacts")
    setDemonstrationRoles(input: [SetDemonstrationRoleInput!]!): [DemonstrationRoleAssignment!]!
      @auth(requires: "Mutate Demonstration Contacts")
    unsetDemonstrationRoles(
      input: [UnsetDemonstrationRoleInput!]!
    ): [DemonstrationRoleAssignment!]! @auth(requires: "Mutate Demonstration Contacts")
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
