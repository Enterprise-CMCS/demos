import React from "react";

import type { PhaseName, PhaseStatus, PhaseStatusLookup } from "./PhaseSelector";

export interface PhaseMeta {
  dueDate?: Date;
  isPastDue?: boolean;
}

export type PhaseMetaLookup = Partial<Record<PhaseName, PhaseMeta>>;

export interface PhaseStatusContextValue {
  phaseStatusLookup: PhaseStatusLookup;
  updatePhaseStatus: (phase: PhaseName, status: PhaseStatus) => void;
  phaseMetaLookup: PhaseMetaLookup;
  updatePhaseMeta: (phase: PhaseName, meta: PhaseMeta | undefined) => void;
}

export const PhaseStatusContext = React.createContext<PhaseStatusContextValue | undefined>(undefined);

export const usePhaseStatusContext = () => {
  const context = React.useContext(PhaseStatusContext);
  if (!context) {
    throw new Error("usePhaseStatusContext must be used within a PhaseStatusContext.Provider");
  }
  return context;
};
