import { gql } from "graphql-tag";
import { Amendment } from "../modification/modificationSchema.js";

export const modificationStatusSchema = gql`
  type AmendmentStatus {
    id: String!
    description: String!
    createdAt: DateTime!
    updatedAt: DateTime!
    amendments: [Amendment!]!
  }

  input AddAmendmentStatusInput {
    id: String!
    description: String!
  }

  input UpdateAmendmentStatusInput {
    description: String
  }

  type Mutation {
    addAmendmentStatus(input: AddAmendmentStatusInput!): AmendmentStatus
    updateAmendmentStatus(id: String!, input: UpdateAmendmentStatusInput!): AmendmentStatus
    deleteAmendmentStatus(id: String!): AmendmentStatus
  }

  type Query {
    getAmendmentStatuses: [AmendmentStatus]!
    getAmendmentStatus(id: String!): AmendmentStatus
  }
`;

export type DateTime = Date;
export interface AmendmentStatus {
  id: string;
  description: string;
  createdAt: DateTime;
  updatedAt: DateTime;
  amendments: Amendment[];
}

export interface AddAmendmentStatusInput {
  id: string;
  description: string;
}

export interface UpdateAmendmentStatusInput {
  description?: string;
}
