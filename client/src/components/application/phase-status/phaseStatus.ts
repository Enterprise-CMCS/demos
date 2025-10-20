import { ApplicationPhase, PhaseName, PhaseStatus } from "demos-server";

export type SimplePhase = Pick<ApplicationPhase, "phaseName" | "phaseStatus">;

export const getStatusForPhase = (
  applicationPhases: SimplePhase[],
  phaseName: PhaseName
): PhaseStatus | null => {
  const phase = applicationPhases.find((p) => p.phaseName === phaseName);
  return phase ? phase.phaseStatus : null;
};

export const setStatusForPhase = (
  applicationPhases: SimplePhase[],
  phaseName: PhaseName,
  phaseStatus: PhaseStatus
): SimplePhase[] => {
  return applicationPhases.map((phase) => {
    if (phase.phaseName === phaseName) {
      return { ...phase, phaseStatus };
    }
    return phase;
  });
};
