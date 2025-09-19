import { Phase, PhaseStatus, BundlePhaseDate } from "../../types.js";
import { gql } from "graphql-tag";

export const bundlePhaseSchema = gql`
  type BundlePhase {
    phase: Phase!
    phaseStatus: PhaseStatus!
    phaseDates: [BundlePhaseDate!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }
`;

export interface BundlePhase {
  phase: Phase;
  phaseStatus: PhaseStatus;
  phaseDates: BundlePhaseDate[];
  createdAt: Date;
  updatedAt: Date;
}
