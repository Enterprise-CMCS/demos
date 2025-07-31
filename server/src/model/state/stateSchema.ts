import { gql } from "graphql-tag";
import { Demonstration } from "../demonstration/demonstrationSchema.js";
import { User } from "../user/userSchema.js";

export const stateSchema = gql`
  type State {
    id: String!
    name: String!
    users: [User!]!
    demonstrations: [Demonstration!]!
  }

  type Query {
    states: [State!]!
    state(id: String!): State
  }
`;

export interface State {
  id: string;
  name: string;
  users: User[];
  demonstrations: Demonstration[];
}
