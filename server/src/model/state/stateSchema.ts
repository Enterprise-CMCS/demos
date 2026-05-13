import { gql } from "graphql-tag";
import { Demonstration } from "../demonstration/demonstrationSchema.js";

export const stateSchema = gql`
  type State {
    id: String!
    name: String!
    demonstrations: [Demonstration!]! @auth(requires: "Access State Demonstrations")
  }

  type Query {
    states: [State!]!
    state(id: String!): State
  }
`;

export interface State {
  id: string;
  name: string;
  demonstrations: Demonstration[];
}
