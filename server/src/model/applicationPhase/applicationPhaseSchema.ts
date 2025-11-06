import { PhaseName, PhaseStatus, ApplicationDate, Document } from "../../types.js";
import { gql } from "graphql-tag";

export const applicationPhaseSchema = gql`
  type ApplicationPhase {
    phaseName: PhaseName!
    phaseStatus: PhaseStatus!
    phaseDates: [ApplicationDate!]!
    createdAt: DateTime!
    updatedAt: DateTime!
    documents: [Document!]!
  }

  input SetApplicationPhaseStatusInput {
    applicationId: ID!
    phaseName: PhaseName!
    phaseStatus: PhaseStatus!
  }

  type Mutation {
    setApplicationPhaseStatus(input: SetApplicationPhaseStatusInput!): Demonstration!
  }
`;

export interface ApplicationPhase {
  phaseName: PhaseName;
  phaseStatus: PhaseStatus;
  phaseDates: ApplicationDate[];
  createdAt: Date;
  updatedAt: Date;
  documents: Document[];
}

export interface SetApplicationPhaseStatusInput {
  applicationId: string;
  phaseName: PhaseName;
  phaseStatus: PhaseStatus;
}
