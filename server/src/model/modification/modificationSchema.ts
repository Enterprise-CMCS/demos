import { gql } from "graphql-tag";
import { Demonstration } from "../demonstration/demonstrationSchema.js";
import { AmendmentStatus } from "../modificationStatus/modificationStatusSchema.js";
import { User } from "../user/userSchema.js";
import { Document } from "../document/documentSchema.js";

export const modificationSchema = gql`
  type Amendment {
    id: ID!
    demonstration: Demonstration!
    name: String!
    description: String!
    effectiveDate: Date!
    expirationDate: Date!
    createdAt: DateTime!
    updatedAt: DateTime!
    amendmentStatus: AmendmentStatus!
    projectOfficer: User!
    documents: [Document!]!
  }

  input CreateAmendmentInput {
    demonstrationId: ID!
    name: String!
    description: String!
    effectiveDate: Date!
    expirationDate: Date!
    amendmentStatusId: ID!
    projectOfficerUserId: String!
  }

  input UpdateAmendmentInput {
    demonstrationId: ID
    name: String
    description: String
    effectiveDate: Date
    expirationDate: Date
    amendmentStatusId: ID
    projectOfficerUserId: String
  }

  type Mutation {
    createAmendment(input: CreateAmendmentInput!): Amendment
    updateAmendment(id: ID!, input: UpdateAmendmentInput!): Amendment
    deleteAmendment(id: ID!): Amendment
  }

  type Query {
    amendments: [Amendment!]!
    amendment(id: ID!): Amendment
  }
`;

export type DateTime = Date;
export interface Amendment {
  id: string;
  demonstration: Demonstration;
  name: string;
  description: string;
  effectiveDate: Date;
  expirationDate: Date;
  createdAt: DateTime;
  updatedAt: DateTime;
  amendmentStatus: AmendmentStatus;
  projectOfficer: User;
  documents: Document[];
}

export interface CreateAmendmentInput {
  demonstrationId: string;
  name: string;
  description: string;
  effectiveDate: Date;
  expirationDate: Date;
  amendmentStatusId: string;
  projectOfficerUserId: string;
}

export interface UpdateAmendmentInput {
  demonstrationId?: string;
  name?: string;
  description?: string;
  effectiveDate?: Date;
  expirationDate?: Date;
  amendmentStatusId?: string;
  projectOfficerUserId?: string;
}
