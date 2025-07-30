import { gql } from "graphql-tag";
import { Amendment } from "../modification/modificationSchema.js";

export const modificationStatusSchema = gql`
  type AmendmentStatus {
    id: String!
    name: String!
    description: String!
    createdAt: DateTime!
    updatedAt: DateTime!
    amendments: [Amendment!]!
  }

  input AddAmendmentStatusInput {
    id: String!
    name: String!
    description: String!
  }

  input UpdateAmendmentStatusInput {
    name: String
    description: String
  }

  type Mutation {
    addAmendmentStatus(input: AddAmendmentStatusInput!): AmendmentStatus
    updateAmendmentStatus(
      id: String!
      input: UpdateAmendmentStatusInput!
    ): AmendmentStatus
    deleteAmendmentStatus(id: String!): AmendmentStatus
  }

  type Query {
    amendmentStatuses: [AmendmentStatus!]!
    amendmentStatus(id: String!): AmendmentStatus
  }
`;

export type DateTime = Date;
export interface AmendmentStatus {
  id: string;
  name: string;
  description: string;
  createdAt: DateTime;
  updatedAt: DateTime;
  amendments: Amendment[];
}

export interface AddAmendmentStatusInput {
  id: string;
  name: string;
  description: string;
}

export interface UpdateAmendmentStatusInput {
  name?: string;
  description?: string;
}
