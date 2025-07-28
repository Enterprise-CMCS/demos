import { gql } from "graphql-tag";
import { Demonstration } from "../demonstration/demonstrationSchema.js";

export const demonstrationStatusSchema = gql`
  type DemonstrationStatus {
    id: String!
    name: String!
    description: String!
    createdAt: DateTime!
    updatedAt: DateTime!
    demonstrations: [Demonstration!]!
  }

  input AddDemonstrationStatusInput {
    id: String!
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
      id: String!
      input: UpdateDemonstrationStatusInput!
    ): DemonstrationStatus
    deleteDemonstrationStatus(id: String!): DemonstrationStatus
  }

  type Query {
    demonstrationStatuses: [DemonstrationStatus]!
    demonstrationStatus(id: String!): DemonstrationStatus
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
  id: string;
  name: string;
  description: string;
  demonstrationIds?: string[];
}

export interface UpdateDemonstrationStatusInput {
  name?: string;
  description?: string;
  demonstrationIds?: string[];
}
