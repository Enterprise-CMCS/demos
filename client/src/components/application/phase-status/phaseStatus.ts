import { BundlePhase, PhaseName, PhaseStatus } from "demos-server";

export type SimplePhase = Pick<BundlePhase, "phaseName" | "phaseStatus">;

export const getStatusForPhase = (
  bundlePhases: SimplePhase[],
  phaseName: PhaseName
): PhaseStatus | null => {
  const phase = bundlePhases.find((p) => p.phaseName === phaseName);
  return phase ? phase.phaseStatus : null;
};

export const setStatusForPhase = (
  bundlePhases: SimplePhase[],
  phaseName: PhaseName,
  phaseStatus: PhaseStatus
): SimplePhase[] => {
  return bundlePhases.map((phase) => {
    if (phase.phaseName === phaseName) {
      return { ...phase, phaseStatus };
    }
    return phase;
  });
};
