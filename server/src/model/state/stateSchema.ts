import { gql } from "graphql-tag";
import { Demonstration } from "../demonstration/demonstrationSchema.js";

export const stateSchema = gql`
  type State {
    id: String! @auth(requires: "Resolve State")
    name: String! @auth(requires: "Resolve State")
    demonstrations: [Demonstration!]! @auth(requires: "Resolve State Demonstrations")
  }

  type Query {
    states: [State!]! @auth(requires: "Query States")
    state(id: String!): State @auth(requires: "Query States")
  }
`;

export interface State {
  id: string;
  name: string;
  demonstrations: Demonstration[];
}
