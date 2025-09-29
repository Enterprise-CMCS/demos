import React from "react";

import type { PhaseName, PhaseStatus, PhaseStatusLookup } from "./PhaseSelector";

export interface PhaseStatusContextValue {
  phaseStatusLookup: PhaseStatusLookup;
  updatePhaseStatus: (phase: PhaseName, status: PhaseStatus) => void;
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
