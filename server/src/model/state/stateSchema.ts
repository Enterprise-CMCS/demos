import { gql } from "graphql-tag";
import { Demonstration } from "../demonstration/demonstrationSchema.js";

export const stateSchema = gql`
  type State {
    id: String!
      @auth(
        permissions: [
          "List Demonstrations"
          "Manage Demonstrations"
          "List Applications"
          "Manage Applications"
          "View Demonstration Details"
          "Manage Demonstration Details"
          "View Application Details"
          "Manage Application Details"
          "View Application Workflow"
          "Manage Application Workflow"
        ]
      )
    name: String!
      @auth(
        permissions: [
          "List Demonstrations"
          "Manage Demonstrations"
          "List Applications"
          "Manage Applications"
          "View Demonstration Details"
          "Manage Demonstration Details"
          "View Application Details"
          "Manage Application Details"
          "View Application Workflow"
          "Manage Application Workflow"
        ]
      )
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
  demonstrations: Demonstration[];
}
