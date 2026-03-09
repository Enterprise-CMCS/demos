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
      @auth(permissions: ["View Application Workflow", "Manage Application Workflow"])
    phaseStatus: PhaseStatus!
      @auth(permissions: ["View Application Workflow", "Manage Application Workflow"])
    phaseDates: [ApplicationDate!]!
      @auth(permissions: ["View Application Workflow", "Manage Application Workflow"])
    phaseNotes: [ApplicationNote!]!
      @auth(permissions: ["View Application Workflow", "Manage Application Workflow"])
    createdAt: DateTime!
    updatedAt: DateTime!
    documents: [Document!]!
  }

  input CompletePhaseInput {
    applicationId: ID!
    phaseName: PhaseNameWithTrackedStatus!
  }

  type Mutation {
    completePhase(input: CompletePhaseInput!): Application!
      @auth(permissions: ["Manage Application Workflow"])
    skipConceptPhase(applicationId: ID!): Application!
      @auth(permissions: ["Manage Application Workflow"])
    declareCompletenessPhaseIncomplete(applicationId: ID!): Application!
      @auth(permissions: ["Manage Application Workflow"])
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
