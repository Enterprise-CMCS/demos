import { Demonstration, Amendment, Extension, ClearanceLevel } from "../../types.js";
import { gql } from "graphql-tag";

export const applicationSchema = gql`
  union Application = Demonstration | Amendment | Extension

  input SetApplicationClearanceLevelInput {
    applicationId: ID!
    clearanceLevel: ClearanceLevel!
  }

  type Mutation {
    setApplicationClearanceLevel(input: SetApplicationClearanceLevelInput!): Application!
      @auth(requires: "Mutate Application Workflow")
  }
`;

export type Application = Demonstration | Amendment | Extension;

export type SetApplicationClearanceLevelInput = {
  applicationId: string;
  clearanceLevel: ClearanceLevel;
};
