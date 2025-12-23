import { Demonstration, Amendment, Extension, ClearanceLevel } from "../../types.js";
import { gql } from "graphql-tag";

export const applicationSchema = gql`
  union Application = Demonstration | Amendment | Extension

  input UpdateApplicationClearanceLevelInput {
    applicationId: ID!
    clearanceLevel: ClearanceLevel!
  }

  type Mutation {
    updateApplicationClearanceLevel(input: UpdateApplicationClearanceLevelInput!): Application!
  }
`;

export type Application = Demonstration | Amendment | Extension;

export type UpdateApplicationClearanceLevelInput = {
  applicationId: string;
  clearanceLevel: ClearanceLevel;
};
