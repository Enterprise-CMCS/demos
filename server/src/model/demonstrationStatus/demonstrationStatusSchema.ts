import { gql } from "graphql-tag";
import { Demonstration } from "../demonstration/demonstrationSchema";

export const demonstrationStatusSchema = gql`
  type DemonstrationStatus {
    id: ID!
    name: String!
    description: String!
    createdAt: DateTime!
    updatedAt: DateTime!
    demonstrations: [Demonstration!]!
  }

  input AddDemonstrationStatusInput {
    name: String!
    description: String!
    demonstrationIds: [ID!]
  }

  input UpdateDemonstrationStatusInput {
    name: String
    description: String
    demonstrationIds: [ID!]
  }

  type Mutation {
    addDemonstrationStatus(
      input: AddDemonstrationStatusInput!
    ): DemonstrationStatus
    updateDemonstrationStatus(
      input: UpdateDemonstrationStatusInput!
    ): DemonstrationStatus
    deleteDemonstrationStatus(id: ID!): DemonstrationStatus
  }

  type Query {
    demonstrationStatuses: [DemonstrationStatus]!
    demonstrationStatus(id: ID!): DemonstrationStatus
  }
`;

export type DateTime = Date;
export interface DemonstrationStatus {
  id: string;
  name: string;
  description: string;
  createdAt: DateTime;
  updatedAt: DateTime;
  demonstrations: Demonstration[];
}

export interface AddDemonstrationStatusInput {
  name: string;
  description: string;
  demonstrationIds?: string[];
}

export interface UpdateDemonstrationStatusInput {
  name?: string;
  description?: string;
  demonstrationIds?: string[];
}
