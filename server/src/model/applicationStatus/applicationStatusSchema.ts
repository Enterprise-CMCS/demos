import gql from "graphql-tag";
import type { ApplicationStatus } from "../../types.js";

export const applicationStatusSchema = gql`
  scalar ApplicationStatus

  input SetApplicationStatusInput {
    applicationId: ID!
    status: ApplicationStatus!
  }

  extend type Mutation {
    setApplicationStatus(input: SetApplicationStatusInput!): Application!
  }
`;

export interface SetApplicationStatusInput {
  applicationId: string;
  status: ApplicationStatus;
}
