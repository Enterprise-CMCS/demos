import React, { useState } from "react";
import { Button, SecondaryButton, WarningButton } from "components/button";
import { tw } from "tags/tw";
import { PhaseStatus } from "demos-server";
import { SimplePhase } from "./phaseDates";

type SimulationState = SimplePhase[];

const DEFAULT_SIMULATION_STATE: SimulationState = [
  { phase: "Concept", phaseStatus: "Not Started", phaseDates: [] },
  { phase: "State Application", phaseStatus: "Not Started", phaseDates: [] },
  { phase: "Completeness", phaseStatus: "Not Started", phaseDates: [] },
];

const STYLES = {
  phaseBox: tw`p-4 border-2 rounded-lg bg-white min-h-[120px] flex flex-col justify-between`,
  dateDisplay: tw`text-xs text-gray-600 mt-1`,
  phaseTitle: tw`font-bold text-lg mb-2`,
  phaseStatus: tw`text-sm font-medium mb-2`,
};

const getPhaseBoxClasses = (status: PhaseStatus) => {
  switch (status) {
    case "Started":
      return `${STYLES.phaseBox} border-brand bg-brand-lightest`;
    case "Completed":
      return `${STYLES.phaseBox} border-green-500 bg-green-50`;
    case "Skipped":
      return `${STYLES.phaseBox} border-gray-400 bg-gray-50`;
    default:
      return `${STYLES.phaseBox} border-gray-300`;
  }
};

const BusinessRules = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-bold mb-4">Business Rules</h2>
      <div className="space-y-4 text-sm">
        <div>
          <h3 className="font-semibold">Concept Phase:</h3>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Start Date: Begins when demonstration is created</li>
            <li>Completion Date: When user clicks Finish or Skip</li>
            <li>Note: If skipped, completion is marked when State Application is finished</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold">State Application Phase:</h3>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Start Date: Whichever comes first:</li>
            <li className="ml-4">• User clicked Skip/Finish on Concept Phase</li>
            <li className="ml-4">• When a change is submitted (document or date update)</li>
            <li>Completion Date: When user clicks Finish</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold">Completeness Phase:</h3>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>
              Start Date: As soon as &quot;State Application Submitted Date&quot; is populated
            </li>
            <li>Can also start when a change is submitted on this phase</li>
            <li>Start date is set to whichever date comes first</li>
            <li>Completion Date: When user clicks Finish</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export const PhaseDatesSimulation: React.FC = () => {
  const [simulationState, setSimulationState] = useState<SimulationState>(DEFAULT_SIMULATION_STATE);

  const resetSimulation = () => {
    setSimulationState(DEFAULT_SIMULATION_STATE);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Application Dates Workflow Simulation
          </h1>
          <WarningButton name="reset-simulation" onClick={resetSimulation}>
            Create Demonstration (Resets Simulation)
          </WarningButton>
        </div>

        <div className="flex items-center justify-center gap-8 mb-8"></div>

        <BusinessRules />
      </div>
    </div>
  );
};
