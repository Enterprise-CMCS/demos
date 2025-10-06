import { PhaseName, PhaseStatus, BundleDate } from "../../types.js";
import { gql } from "graphql-tag";

export const bundlePhaseSchema = gql`
  type BundlePhase {
    phaseName: PhaseName!
    phaseStatus: PhaseStatus!
    phaseDates: [BundleDate!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }
`;

export interface BundlePhase {
  phaseName: PhaseName;
  phaseStatus: PhaseStatus;
  phaseDates: BundleDate[];
  createdAt: Date;
  updatedAt: Date;
}
