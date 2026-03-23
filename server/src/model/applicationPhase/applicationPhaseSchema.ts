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
    phaseName: PhaseNameWithTrackedStatus! @auth(requires: "Resolve ApplicationPhase")
    phaseStatus: PhaseStatus! @auth(requires: "Resolve ApplicationPhase")
    phaseDates: [ApplicationDate!]! @auth(requires: "Resolve ApplicationPhase")
    phaseNotes: [ApplicationNote!]! @auth(requires: "Resolve ApplicationPhase")
    createdAt: DateTime! @auth(requires: "Resolve ApplicationPhase")
    updatedAt: DateTime! @auth(requires: "Resolve ApplicationPhase")
    documents: [Document!]! @auth(requires: "Resolve ApplicationPhase Documents")
  }

  input CompletePhaseInput {
    applicationId: ID!
    phaseName: PhaseNameWithTrackedStatus!
  }

  type Mutation {
    completePhase(input: CompletePhaseInput!): Application!
      @auth(requires: "Mutate Application Workflow")
    skipConceptPhase(applicationId: ID!): Application!
      @auth(requires: "Mutate Application Workflow")
    declareCompletenessPhaseIncomplete(applicationId: ID!): Application!
      @auth(requires: "Mutate Application Workflow")
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

export interface CompletePhaseInput {
  applicationId: string;
  phaseName: PhaseNameWithTrackedStatus;
}
