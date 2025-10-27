import type { PhaseName, PhaseStatus } from "demos-server";

// TODO: get the input from this, perhaps wait for B/E ticket to be done.
export interface SetPhaseStatusInput {
  applicationId: string;
  phaseName: PhaseName;
  phaseStatus: PhaseStatus;
}

export const getQueryForSetPhaseStatus = (setPhaseStatusInput: SetPhaseStatusInput): string => {
  return `
    mutation SetPhaseStatus {
      setPhaseStatus(input: {
        applicationId: "${setPhaseStatusInput.applicationId}",
        phaseName: ${setPhaseStatusInput.phaseName},
        phaseStatus: ${setPhaseStatusInput.phaseStatus}
      })
    }
  `;
};
