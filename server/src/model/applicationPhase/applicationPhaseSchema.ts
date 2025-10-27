import { PhaseName, PhaseStatus, ApplicationDate, Application } from "../../types.js";
import { gql } from "graphql-tag";

export const applicationPhaseSchema = gql`
  type ApplicationPhase {
    phaseName: PhaseName!
    phaseStatus: PhaseStatus!
    phaseDates: [ApplicationDate!]!
    createdAt: DateTime!
    updatedAt: DateTime!
    application: Application!
  }

  input SetApplicationPhaseStatusInput {
    applicationId: ID!
    phaseName: PhaseName!
    phaseStatus: PhaseStatus!
  }

  type Mutation {
    setApplicationPhaseStatus(input: SetApplicationPhaseStatusInput!): ApplicationPhase
  }
`;

export interface ApplicationPhase {
  phaseName: PhaseName;
  phaseStatus: PhaseStatus;
  phaseDates: ApplicationDate[];
  createdAt: Date;
  updatedAt: Date;
  application: Application;
}

export interface SetApplicationPhaseStatusInput {
  applicationId: string;
  phaseName: PhaseName;
  phaseStatus: PhaseStatus;
}
