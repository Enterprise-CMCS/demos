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

  input CreateDemonstrationStatusInput {
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
    createDemonstrationStatus(
      input: CreateDemonstrationStatusInput!
    ): DemonstrationStatus
    updateDemonstrationStatus(
      id: String!
      input: UpdateDemonstrationStatusInput!
    ): DemonstrationStatus
    deleteDemonstrationStatus(id: String!): DemonstrationStatus
  }

  type Query {
    demonstrationStatuses: [DemonstrationStatus!]!
    demonstrationStatus(id: String!): DemonstrationStatus
  }
`;

export interface DemonstrationStatus {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  demonstrations: Demonstration[];
}

export interface CreateDemonstrationStatusInput {
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
