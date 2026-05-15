import { PhaseName, PhaseStatus, ApplicationDate, Document, ApplicationNote } from "../../types.js";
import { gql } from "graphql-tag";

export const applicationPhaseSchema = gql`
  type ApplicationPhase {
    phaseName: PhaseName!
    phaseStatus: PhaseStatus!
    phaseDates: [ApplicationDate!]!
    phaseNotes: [ApplicationNote!]!
    createdAt: DateTime!
    updatedAt: DateTime!
    documents: [Document!]!
  }

  input CompletePhaseInput {
    applicationId: ID!
    phaseName: PhaseName!
  }

  type Mutation {
    completePhase(input: CompletePhaseInput!): Application! @auth(requires: ["Perform CMS Action"])
    skipConceptPhase(applicationId: ID!): Application! @auth(requires: ["Perform CMS Action"])
    declareCompletenessPhaseIncomplete(applicationId: ID!): Application!
      @auth(requires: ["Perform CMS Action"])
  }
`;

export interface ApplicationPhase {
  phaseName: PhaseName;
  phaseStatus: PhaseStatus;
  phaseDates: ApplicationDate[];
  phaseNotes: ApplicationNote[];
  createdAt: Date;
  updatedAt: Date;
  documents: Document[];
}

export interface CompletePhaseInput {
  applicationId: string;
  phaseName: PhaseName;
}
