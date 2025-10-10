import { gql } from "graphql-tag";
import { PersonType, State, DemonstrationRoleAssignment } from "../../types";

export const personSchema = gql`
  type Person {
    id: ID!
    personType: PersonType!
    email: String!
    firstName: String!
    lastName: String!
    # FullName is a computed field (not stored in DB)
    fullName: String!
    createdAt: DateTime!
    updatedAt: DateTime!
    states: [State!]!
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
  firstName: string;
  lastName: string;
  fullName?: string;
  createdAt: Date;
  updatedAt: Date;
  roles: DemonstrationRoleAssignment[];
  states: State[];
};
