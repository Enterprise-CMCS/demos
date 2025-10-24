import { PhaseName, PhaseStatus, ApplicationDate } from "../../types.js";
import { gql } from "graphql-tag";

export const applicationPhaseSchema = gql`
  type ApplicationPhase {
    phaseName: PhaseName!
    phaseStatus: PhaseStatus!
    phaseDates: [ApplicationDate!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input SetPhaseStateInput {
    applicationId: ID!
    phaseName: PhaseName!
    phaseStatus: PhaseStatus!
  }

  type Mutation {
    setPhaseState(input: SetPhaseStateInput!): ApplicationPhase!
  }
`;

export interface ApplicationPhase {
  phaseName: PhaseName;
  phaseStatus: PhaseStatus;
  phaseDates: ApplicationDate[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SetPhaseStateInput {
  applicationId: string;
  phaseName: PhaseName;
  phaseStatus: PhaseStatus;
}
