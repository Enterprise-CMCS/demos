import React, { useState } from "react";
import { Button, SecondaryButton, WarningButton } from "components/button";
import { tw } from "tags/tw";
import { getESTDate, getStartDate, getEndDate } from "./phaseDates";
import { formatTimestamp } from "util/formatDate";
import { BundlePhase } from "demos-server";

interface SimulationState {
  concept: BundlePhase;
  stateApplication: BundlePhase;
  completeness: BundlePhase;
}

const DEFAULT_SIMULATION_STATE: SimulationState = {
  concept: { phaseStatus: "not-started" },
  stateApplication: { phaseName: "not-started" },
  completeness: { phaseName: "not-started" },
};

const PHASE_BOX = tw`p-4 border-2 rounded-lg bg-white min-h-[120px] flex flex-col justify-between`;
const PHASE_ACTIVE = tw`border-brand bg-brand-lightest`;
const PHASE_COMPLETED = tw`border-green-500 bg-green-50`;
const PHASE_SKIPPED = tw`border-gray-400 bg-gray-50`;
const PHASE_NOT_STARTED = tw`border-gray-300`;

const ARROW = tw`text-2xl text-gray-400 flex items-center justify-center`;
const DATE_DISPLAY = tw`text-xs text-gray-600 mt-1`;
const PHASE_TITLE = tw`font-bold text-lg mb-2`;
const PHASE_STATUS = tw`text-sm font-medium mb-2`;

export const PhaseDatesSimulation: React.FC = () => {
  const [simulation, setSimulation] = useState<SimulationState>(DEFAULT_SIMULATION_STATE);
  setSimulation((prev) => ({ ...prev, concept: { status: "started", startDate: new Date() } })); // Ensure state update on initial render
  const resetSimulation = () => {
    setSimulation(DEFAULT_SIMULATION_STATE);
    setSimulation((prev) => ({ ...prev, concept: { status: "started", startDate: new Date() } })); // Ensure state update on initial render
  };

  const getPhaseBoxClasses = (status: PhaseStatus) => {
    switch (status) {
      case "started":
        return `${PHASE_BOX} ${PHASE_ACTIVE}`;
      case "completed":
        return `${PHASE_BOX} ${PHASE_COMPLETED}`;
      case "skipped":
        return `${PHASE_BOX} ${PHASE_SKIPPED}`;
      default:
        return `${PHASE_BOX} ${PHASE_NOT_STARTED}`;
    }
  };

  const getStatusDisplay = (status: PhaseStatus) => {
    switch (status) {
      case "not-started":
        return "Not Started";
      case "started":
        return "In Progress";
      case "completed":
        return "Completed";
      case "skipped":
        return "Skipped";
    }
  };

  const finishConceptPhase = () => {
    const now = new Date();
    const estDate = getESTDate(now);
    const completionDate = getEndDate(estDate);

    setSimulation((prev) => ({
      ...prev,
      concept: {
        ...prev.concept,
        status: "completed",
        startDate: prev.concept.startDate,
        completionDate: completionDate,
      },
      stateApplication: {
        ...prev.stateApplication,
        status: "started",
        startDate: getStartDate(estDate),
      },
    }));
  };

  const skipConceptPhase = () => {
    const now = new Date();
    const estDate = getESTDate(now);

    setSimulation((prev) => ({
      ...prev,
      concept: {
        ...prev.concept,
        status: "skipped",
        startDate: prev.concept.startDate,
        completionDate: getEndDate(estDate),
      },
      stateApplication: {
        ...prev.stateApplication,
        status: "started",
        startDate: getStartDate(estDate),
      },
    }));
  };

  const finishStateApplicationPhase = () => {
    const now = new Date();
    const estDate = getESTDate(now);
    const completionDate = getEndDate(estDate);

    setSimulation((prev) => ({
      ...prev,
      stateApplication: {
        ...prev.stateApplication,
        status: "completed",
        completionDate: completionDate,
      },
      completeness: {
        ...prev.completeness,
        status: "started",
        startDate: getStartDate(estDate),
      },
      // Set State Application Submitted Date if not already set
      stateApplicationSubmittedDate: prev.stateApplicationSubmittedDate || now,
    }));
  };

  const submitStateApplicationDate = () => {
    const now = new Date();
    const estDate = getESTDate(now);

    setSimulation((prev) => {
      const newState = {
        ...prev,
        stateApplicationSubmittedDate: now,
      };

      // If completeness phase hasn't started yet, start it now
      if (prev.completeness.status === "not-started") {
        newState.completeness = {
          ...prev.completeness,
          status: "started",
          startDate: getStartDate(estDate),
        };
      }

      return newState;
    });
  };

  const finishCompletenessPhase = () => {
    const now = new Date();
    const estDate = getESTDate(now);
    const completionDate = getEndDate(estDate);

    setSimulation((prev) => ({
      ...prev,
      completeness: {
        ...prev.completeness,
        status: "completed",
        completionDate: completionDate,
      },
    }));
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Application Dates Workflow Simulation
          </h1>
          <WarningButton name="reset-simulation" onClick={resetSimulation} size="large">
            Reset Simulation / (Create Demonstration)
          </WarningButton>
        </div>

        {/* Flowchart */}
        <div className="flex items-center justify-center gap-8 mb-8">
          {/* Concept Phase */}
          <div className={getPhaseBoxClasses(simulation.concept.status)}>
            <div>
              <div className={PHASE_TITLE}>Concept Phase</div>
              <div className={PHASE_STATUS}>
                Status: {getStatusDisplay(simulation.concept.status)}
              </div>
              {simulation.concept.startDate && (
                <div className={DATE_DISPLAY}>
                  Started: {formatTimestamp(simulation.concept.startDate)}
                </div>
              )}
              {simulation.concept.completionDate && (
                <div className={DATE_DISPLAY}>
                  Completed: {formatTimestamp(simulation.concept.completionDate)}
                </div>
              )}
            </div>
            {simulation.concept.status === "started" && (
              <div className="flex gap-2 mt-4">
                <Button name="finish-concept" onClick={finishConceptPhase} size="small">
                  Finish
                </Button>
                <SecondaryButton name="skip-concept" onClick={skipConceptPhase} size="small">
                  Skip
                </SecondaryButton>
              </div>
            )}
          </div>

          {/* Arrow */}
          <div className={ARROW}>→</div>

          {/* State Application Phase */}
          <div className={getPhaseBoxClasses(simulation.stateApplication.status)}>
            <div>
              <div className={PHASE_TITLE}>State Application</div>
              <div className={PHASE_STATUS}>
                Status: {getStatusDisplay(simulation.stateApplication.status)}
              </div>
              {simulation.stateApplication.startDate && (
                <div className={DATE_DISPLAY}>
                  Started: {formatTimestamp(simulation.stateApplication.startDate)}
                </div>
              )}
              {simulation.stateApplicationSubmittedDate && (
                <div className={DATE_DISPLAY}>
                  Submitted: {formatTimestamp(simulation.stateApplicationSubmittedDate)}
                </div>
              )}
              {simulation.stateApplication.completionDate && (
                <div className={DATE_DISPLAY}>
                  Completed: {formatTimestamp(simulation.stateApplication.completionDate)}
                </div>
              )}
            </div>
            {simulation.stateApplication.status === "started" && (
              <div className="flex gap-2 mt-4">
                <Button name="finish-state-app" onClick={finishStateApplicationPhase} size="small">
                  Finish
                </Button>
                <SecondaryButton
                  name="submit-date"
                  onClick={submitStateApplicationDate}
                  size="small"
                >
                  Submit Date
                </SecondaryButton>
              </div>
            )}
          </div>

          {/* Arrow */}
          <div className={ARROW}>→</div>

          {/* Completeness Phase */}
          <div className={getPhaseBoxClasses(simulation.completeness.status)}>
            <div>
              <div className={PHASE_TITLE}>Completeness</div>
              <div className={PHASE_STATUS}>
                Status: {getStatusDisplay(simulation.completeness.status)}
              </div>
              {simulation.completeness.startDate && (
                <div className={DATE_DISPLAY}>
                  Started: {formatTimestamp(simulation.completeness.startDate)}
                </div>
              )}
              {simulation.completeness.completionDate && (
                <div className={DATE_DISPLAY}>
                  Completed: {formatTimestamp(simulation.completeness.completionDate)}
                </div>
              )}
            </div>
            {simulation.completeness.status === "started" && (
              <div className="flex gap-2 mt-4">
                <Button name="finish-completeness" onClick={finishCompletenessPhase} size="small">
                  Finish
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Business Rules Documentation */}
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
      </div>
    </div>
  );
};
