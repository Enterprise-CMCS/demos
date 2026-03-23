import { gql } from "graphql-tag";

import { DemonstrationRoleAssignment, PersonType, State } from "../../types";

export const personSchema = gql`
  type Person {
    id: ID! @auth(requires: "Resolve Person")
    personType: PersonType! @auth(requires: "Resolve Person")
    email: String! @auth(requires: "Resolve Person")
    firstName: String! @auth(requires: "Resolve Person")
    lastName: String! @auth(requires: "Resolve Person")
    # FullName is a computed field (not stored in DB)
    fullName: String! @auth(requires: "Resolve Person")
    createdAt: DateTime! @auth(requires: "Resolve Person")
    updatedAt: DateTime! @auth(requires: "Resolve Person")
    states: [State!]! @auth(requires: "Resolve Person")
    roles: [DemonstrationRoleAssignment!]! @auth(requires: "Resolve Person Roles")
  }
  type Query {
    person(id: ID!): Person @auth(requires: "Query People")
    people: [Person!]! @auth(requires: "Query People")
    searchPeople(search: String!, demonstrationId: ID): [Person!]! @auth(requires: "Query People")
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
