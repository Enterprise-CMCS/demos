import type { SetApplicationPhaseStatusInput } from "demos-server";

export const getQueryForSetPhaseStatus = (
  setPhaseStatusInput: SetApplicationPhaseStatusInput
): string => {
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
