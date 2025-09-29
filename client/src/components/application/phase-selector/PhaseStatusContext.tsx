import React from "react";

import type { PhaseStatus as ServerPhaseStatus } from "demos-server";
import type { PhaseName, PhaseStatusLookup } from "./PhaseSelector";

export interface PhaseMeta {
  dueDate?: Date;
}

export type PhaseMetaLookup = Partial<Record<PhaseName, PhaseMeta>>;

export interface PhaseStatusContextValue {
  phaseStatusLookup: PhaseStatusLookup;
  updatePhaseStatus: (phase: PhaseName, status: ServerPhaseStatus) => void;
  phaseMetaLookup: PhaseMetaLookup;
  updatePhaseMeta: (phase: PhaseName, meta: PhaseMeta | undefined) => void;
  selectedPhase: PhaseName;
  selectPhase: (phase: PhaseName) => void;
  selectNextPhase: (current: PhaseName) => void;
}

export const PhaseStatusContext = React.createContext<PhaseStatusContextValue | undefined>(undefined);

export const usePhaseStatusContext = () => {
  const context = React.useContext(PhaseStatusContext);
  if (!context) {
    throw new Error("usePhaseStatusContext must be used within a PhaseStatusContext.Provider");
  }
  return context;
};
