import { PhaseName, PhaseStatus, BundlePhaseDate } from "../../types.js";
import { gql } from "graphql-tag";

export const bundlePhaseSchema = gql`
  type BundlePhase {
    phaseName: PhaseName!
    phaseStatus: PhaseStatus!
    phaseDates: [BundlePhaseDate!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }
`;

export interface BundlePhase {
  phaseName: PhaseName;
  phaseStatus: PhaseStatus;
  phaseDates: BundlePhaseDate[];
  createdAt: Date;
  updatedAt: Date;
}
