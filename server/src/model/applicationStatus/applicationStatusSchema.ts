import gql from "graphql-tag";

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
  status: string; // ApplicationStatus type
}
