import gql from "graphql-tag";
import { PersonType } from "../../types";
import { DemonstrationRoleAssignment } from "../demonstrationRoleAssignment/demonstrationRoleAssignmentSchema";

export const personSchema = gql`
  type Person {
    id: ID!
    personType: PersonType!
    email: String!
    fullName: String!
    displayName: String!
    createdAt: DateTime!
    updatedAt: DateTime!
    roles: [DemonstrationRoleAssignment!]!
  }

  type Query {
    person(id: ID!): Person
    people: [Person!]!
  }
`;

export type Person = {
  id: string;
  personType: PersonType;
  email: string;
  fullName: string;
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
  roles: DemonstrationRoleAssignment[];
};
