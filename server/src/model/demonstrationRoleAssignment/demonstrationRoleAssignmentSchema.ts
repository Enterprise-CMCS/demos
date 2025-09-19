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
`;

export type DemonstrationRoleAssignment = {
  demonstration: Demonstration;
  person: Person;
  role: Role;
  isPrimary: boolean;
};
