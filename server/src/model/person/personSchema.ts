import { gql } from "graphql-tag";

import { DemonstrationRoleAssignment, PersonType, State } from "../../types";

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
    person(id: ID!): Person! @auth(requires: ["Access CMS Query"])
    people: [Person!]! @auth(requires: ["Access CMS Query"])
    searchPeople(search: String!, demonstrationId: ID): [Person!]!
      @auth(requires: ["Access CMS Query"])
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
