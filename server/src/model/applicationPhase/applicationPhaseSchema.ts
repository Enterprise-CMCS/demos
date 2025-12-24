import {
  PhaseNameWithTrackedStatus,
  PhaseStatus,
  ApplicationDate,
  Document,
  ApplicationNote,
} from "../../types.js";
import { gql } from "graphql-tag";

export const applicationPhaseSchema = gql`
  type ApplicationPhase {
    phaseName: PhaseNameWithTrackedStatus!
    phaseStatus: PhaseStatus!
    phaseDates: [ApplicationDate!]!
    phaseNotes: [ApplicationNote!]!
    createdAt: DateTime!
    updatedAt: DateTime!
    documents: [Document!]!
  }

  input SetApplicationPhaseStatusInput {
    applicationId: ID!
    phaseName: PhaseNameWithTrackedStatus!
    phaseStatus: PhaseStatus!
  }

  input CompletePhaseInput {
    applicationId: ID!
    phaseName: PhaseNameWithTrackedStatus!
  }

  type Mutation {
    setApplicationPhaseStatus(input: SetApplicationPhaseStatusInput!): Application!
    completePhase(input: CompletePhaseInput!): Application!
    skipConceptPhase(applicationId: ID!): Application!
    declareCompletenessPhaseIncomplete(applicationId: ID!): Application!
  }
`;

export interface ApplicationPhase {
  phaseName: PhaseNameWithTrackedStatus;
  phaseStatus: PhaseStatus;
  phaseDates: ApplicationDate[];
  phaseNotes: ApplicationNote[];
  createdAt: Date;
  updatedAt: Date;
  documents: Document[];
}

export interface SetApplicationPhaseStatusInput {
  applicationId: string;
  phaseName: PhaseNameWithTrackedStatus;
  phaseStatus: PhaseStatus;
}

export interface CompletePhaseInput {
  applicationId: string;
  phaseName: PhaseNameWithTrackedStatus;
}
