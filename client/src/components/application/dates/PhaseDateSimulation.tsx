import React, { useState } from "react";
import { Button, SecondaryButton, WarningButton } from "components/button";
import { tw } from "tags/tw";
import { PhaseStatus, DateType } from "demos-server";
import {
  SimplePhase,
  setStatusForPhase,
  getStatusForPhase,
  setDateInPhaseDates,
  getDateFromPhaseDates,
} from "./phaseDates";
import { formatDateTime } from "util/formatDate";

type SimulationState = SimplePhase[];

const DEFAULT_SIMULATION_STATE: SimulationState = [
  { phase: "Concept", phaseStatus: "Not Started", phaseDates: [] },
  { phase: "State Application", phaseStatus: "Started", phaseDates: [] },
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
            <li>
              <strong>Start Date</strong>: Begins when the demonstration, amendment or extension is
              created.
            </li>
            <li>
              <strong>Completion Date</strong>: When user clicks the Finish or skip button.
            </li>
          </ul>
          <div className="mt-1">
            Note: If skipped, completion is marked when State Application is finished
          </div>
        </div>
        <div>
          <h3 className="font-semibold">State Application Phase:</h3>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>
              <strong>Start Date:</strong> Starts by default when demonstration is created, or when
              a change is submitted on this phase - document or date update.
            </li>
            <li>
              <strong>Completion Date:</strong> Completed when user clicks Finish to progress to the
              next phase.
            </li>
            <li>
              <strong>Note:</strong> Any change submitted on this phase will implicitly mark the
              Concept phase as completed if it hasn&apos;t been explicitly finished or skipped.
            </li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold">Completeness Phase:</h3>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>
              <strong>Start Date:</strong> As soon as the State Application Submitted Date field is
              populated on the State Application Phase. Can also start when a change is submitted on
              this phase - document or date update. Start date is set to whichever of the dates
              above, is first
            </li>
            <li>
              <strong>Completion Date:</strong> Completed when user clicks Finish to progress to the
              next phase. Completed Date is set to this date.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// NOSONAR - This file is a testing and simulation tool only, not part of production code
export const PhaseDatesSimulation: React.FC = () => {
  const [simulationState, setSimulationState] = useState<SimulationState>(DEFAULT_SIMULATION_STATE);
  const [demonstrationCreated, setDemonstrationCreated] = useState(false);

  const updatePhaseDate = (
    phases: SimulationState,
    phaseName: "Concept" | "State Application" | "Completeness",
    dateType: DateType,
    dateValue: Date
  ): SimulationState => {
    return phases.map((phase) => {
      if (phase.phase === phaseName) {
        const updatedDates = setDateInPhaseDates(phase.phaseDates, dateType, dateValue);

        // If the date doesn't exist, add it
        const existingDate = getDateFromPhaseDates(phase.phaseDates, dateType);
        if (!existingDate) {
          updatedDates.push({
            dateType: dateType,
            dateValue: dateValue,
          });
        }

        return { ...phase, phaseDates: updatedDates };
      }
      return phase;
    });
  };

  // Business Rule: Create Demonstration starts Concept Phase
  const createDemonstration = () => {
    const now = new Date();

    let updatedState = setStatusForPhase(simulationState, "Concept", "Started");
    updatedState = updatePhaseDate(updatedState, "Concept", "Start Date", now);

    // Business Rule: State Application is also started by default
    updatedState = updatePhaseDate(updatedState, "State Application", "Start Date", now);

    setSimulationState(updatedState);
    setDemonstrationCreated(true);
  };

  // Business Rule: Finish Concept Phase
  const finishConceptPhase = () => {
    const now = new Date();

    let updatedState = setStatusForPhase(simulationState, "Concept", "Completed");
    updatedState = updatePhaseDate(updatedState, "Concept", "Completion Date", now);

    // Business Rule: State Application starts when Concept finishes
    updatedState = setStatusForPhase(updatedState, "State Application", "Started");
    updatedState = updatePhaseDate(updatedState, "State Application", "Start Date", now);

    setSimulationState(updatedState);
  };

  // Business Rule: Skip Concept Phase
  const skipConceptPhase = () => {
    const now = new Date();

    let updatedState = setStatusForPhase(simulationState, "Concept", "Skipped");
    updatedState = updatePhaseDate(updatedState, "Concept", "Completion Date", now);

    // Business Rule: State Application starts when Concept is skipped
    updatedState = setStatusForPhase(updatedState, "State Application", "Started");
    updatedState = updatePhaseDate(updatedState, "State Application", "Start Date", now);

    setSimulationState(updatedState);
  };

  // Business Rule: Any change submitted on State Application Phase implicitly completes Concept
  const submitChangeOnStateApplication = () => {
    const now = new Date();

    // Business Rule: If Concept is still "Not Started" or "Started", mark it as completed
    const conceptStatus = getStatusForPhase(simulationState, "Concept");
    let updatedState = simulationState;

    if (conceptStatus === "Not Started" || conceptStatus === "Started") {
      updatedState = setStatusForPhase(updatedState, "Concept", "Completed");
      updatedState = updatePhaseDate(updatedState, "Concept", "Completion Date", now);
    }

    // This represents any change (document upload, date update, etc.) on State Application
    // For simulation purposes, we'll update the submitted date
    updatedState = updatePhaseDate(
      updatedState,
      "State Application",
      "State Application Submitted Date",
      now
    );

    // Business Rule: Completeness starts as soon as State Application Submitted Date is populated
    const completenessStatus = getStatusForPhase(updatedState, "Completeness");
    if (completenessStatus === "Not Started") {
      updatedState = setStatusForPhase(updatedState, "Completeness", "Started");
      updatedState = updatePhaseDate(updatedState, "Completeness", "Start Date", now);
    }

    setSimulationState(updatedState);
  };

  // Business Rule: Finish State Application Phase
  const finishStateApplicationPhase = () => {
    const now = new Date();

    let updatedState = setStatusForPhase(simulationState, "State Application", "Completed");
    updatedState = updatePhaseDate(updatedState, "State Application", "Completion Date", now);

    // Business Rule: If Concept was skipped, mark it completed now
    const conceptStatus = getStatusForPhase(updatedState, "Concept");
    if (conceptStatus === "Skipped") {
      updatedState = setStatusForPhase(updatedState, "Concept", "Completed");
    }

    setSimulationState(updatedState);
  };

  // Business Rule: Finish Completeness Phase
  const finishCompletenessPhase = () => {
    const now = new Date();

    let updatedState = setStatusForPhase(simulationState, "Completeness", "Completed");
    updatedState = updatePhaseDate(updatedState, "Completeness", "Completion Date", now);

    setSimulationState(updatedState);
  };

  const resetSimulation = () => {
    setSimulationState(DEFAULT_SIMULATION_STATE);
    setDemonstrationCreated(false);
  };

  const getDateDisplay = (phase: SimplePhase, dateType: DateType) => {
    const date = getDateFromPhaseDates(phase.phaseDates, dateType);
    return date ? formatDateTime(date, "millisecond") : "Not set";
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Application Dates Workflow Simulation
          </h1>
          <WarningButton name="reset-simulation" onClick={resetSimulation}>
            Reset Simulation
          </WarningButton>
        </div>

        {/* Create Demonstration Button */}
        {!demonstrationCreated && (
          <div className="mb-8 text-center">
            <Button name="create-demonstration" onClick={createDemonstration}>
              Create Demonstration
            </Button>
            <p className="mt-2 text-gray-600">Start the simulation by creating a demonstration</p>
          </div>
        )}

        {/* Phase Flowchart */}
        {demonstrationCreated && (
          <div className="flex items-center justify-center gap-8 mb-8">
            {/* Concept Phase */}
            <div
              className={getPhaseBoxClasses(
                getStatusForPhase(simulationState, "Concept") || "Not Started"
              )}
            >
              <div>
                <div className={STYLES.phaseTitle}>Concept Phase</div>
                <div className={STYLES.phaseStatus}>
                  Status: {getStatusForPhase(simulationState, "Concept")}
                </div>

                <div className={STYLES.dateDisplay}>
                  Start Date:{" "}
                  {getDateDisplay(
                    simulationState.find((p) => p.phase === "Concept")!,
                    "Start Date"
                  )}
                </div>
                <div className={STYLES.dateDisplay}>
                  Completion Date:{" "}
                  {getDateDisplay(
                    simulationState.find((p) => p.phase === "Concept")!,
                    "Completion Date"
                  )}
                </div>
              </div>

              {getStatusForPhase(simulationState, "Concept") === "Started" && (
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
            <div className="text-2xl text-gray-400">→</div>

            {/* State Application Phase */}
            <div
              className={getPhaseBoxClasses(
                getStatusForPhase(simulationState, "State Application") || "Not Started"
              )}
            >
              <div>
                <div className={STYLES.phaseTitle}>State Application</div>
                <div className={STYLES.phaseStatus}>
                  Status: {getStatusForPhase(simulationState, "State Application")}
                </div>

                <div className={STYLES.dateDisplay}>
                  Start Date:{" "}
                  {getDateDisplay(
                    simulationState.find((p) => p.phase === "State Application")!,
                    "Start Date"
                  )}
                </div>
                <div className={STYLES.dateDisplay}>
                  Submitted Date:{" "}
                  {getDateDisplay(
                    simulationState.find((p) => p.phase === "State Application")!,
                    "State Application Submitted Date"
                  )}
                </div>
                <div className={STYLES.dateDisplay}>
                  Completion Date:{" "}
                  {getDateDisplay(
                    simulationState.find((p) => p.phase === "State Application")!,
                    "Completion Date"
                  )}
                </div>
              </div>

              {getStatusForPhase(simulationState, "State Application") === "Started" && (
                <div className="flex gap-2 mt-4">
                  <Button
                    name="finish-state-app"
                    onClick={finishStateApplicationPhase}
                    size="small"
                  >
                    Finish
                  </Button>
                  <SecondaryButton
                    name="submit-change"
                    onClick={submitChangeOnStateApplication}
                    size="small"
                  >
                    Submit Change (Document/Date)
                  </SecondaryButton>
                </div>
              )}
            </div>

            {/* Arrow */}
            <div className="text-2xl text-gray-400">→</div>

            {/* Completeness Phase */}
            <div
              className={getPhaseBoxClasses(
                getStatusForPhase(simulationState, "Completeness") || "Not Started"
              )}
            >
              <div>
                <div className={STYLES.phaseTitle}>Completeness</div>
                <div className={STYLES.phaseStatus}>
                  Status: {getStatusForPhase(simulationState, "Completeness")}
                </div>

                <div className={STYLES.dateDisplay}>
                  Start Date:{" "}
                  {getDateDisplay(
                    simulationState.find((p) => p.phase === "Completeness")!,
                    "Start Date"
                  )}
                </div>
                <div className={STYLES.dateDisplay}>
                  Completion Date:{" "}
                  {getDateDisplay(
                    simulationState.find((p) => p.phase === "Completeness")!,
                    "Completion Date"
                  )}
                </div>
              </div>

              {getStatusForPhase(simulationState, "Completeness") === "Started" && (
                <div className="flex gap-2 mt-4">
                  <Button name="finish-completeness" onClick={finishCompletenessPhase} size="small">
                    Finish
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        <BusinessRules />
      </div>
    </div>
  );
};
