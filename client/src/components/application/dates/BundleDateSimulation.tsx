import React, { useState } from "react";
import { Button, SecondaryButton, WarningButton } from "components/button";
import { tw } from "tags/tw";
import { DateType, PhaseName, PhaseStatus } from "demos-server";
import { SimpleBundleDate, setDateInBundleDates, getDateFromBundleDates } from "./bundleDates";
import { SimplePhase, setStatusForPhase, getStatusForPhase } from "../phases/phaseStatus";
import { formatDateTime } from "util/formatDate";

type SimulationState = {
  phases: SimplePhase[];
  bundleDates: SimpleBundleDate[];
};

const DEFAULT_SIMULATION_STATE: SimulationState = {
  phases: [
    { phaseName: "Concept", phaseStatus: "Not Started" },
    { phaseName: "State Application", phaseStatus: "Not Started" },
    { phaseName: "Completeness", phaseStatus: "Not Started" },
  ],
  bundleDates: [],
};
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
              <strong>Concept Start Date</strong>: Begins when the demonstration, amendment or
              extension is created.
            </li>
            <li>
              <strong>Concept Completion Date</strong>: When user clicks the Finish or skip button.
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
              <strong>State Application Start Date:</strong> Starts by default when demonstration is
              created, or when a change is submitted on this phase - document or date update.
            </li>
            <li>
              <strong>State Application Completion Date:</strong> Completed when user clicks Finish
              to progress to the next phase.
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
              <strong>Completeness Start Date:</strong> As soon as the State Application Submitted
              Date field is populated on the State Application Phase. Can also start when a change
              is submitted on this phase - document or date update. Start date is set to whichever
              of the dates above, is first
            </li>
            <li>
              <strong>Completeness Completion Date:</strong> Completed when user clicks Finish to
              progress to the next phase. Completeness Completed Date is set to this date.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export const BundleDateSimulation: React.FC = () => {
  const [simulationState, setSimulationState] = useState<SimulationState>(DEFAULT_SIMULATION_STATE);
  const [demonstrationCreated, setDemonstrationCreated] = useState(false);

  // Generic function to start a phase
  const startPhase = (phaseName: PhaseName, startDateType: DateType) => {
    const now = new Date();
    const updatedPhases = setStatusForPhase(simulationState.phases, phaseName, "Started");
    const updatedDates = setDateInBundleDates(simulationState.bundleDates, startDateType, now);
    setSimulationState({ phases: updatedPhases, bundleDates: updatedDates });
  };

  // Generic function to complete a phase with optional completion date
  const completePhase = (
    phaseName: PhaseName,
    completionDateType: DateType | null = null,
    nextPhaseName?: PhaseName,
    nextPhaseStartDateType?: DateType
  ) => {
    const now = new Date();
    let updatedPhases = setStatusForPhase(simulationState.phases, phaseName, "Completed");
    let updatedDates = simulationState.bundleDates;

    if (completionDateType) {
      updatedDates = setDateInBundleDates(updatedDates, completionDateType, now);
    }

    // Start next phase if specified
    if (nextPhaseName && nextPhaseStartDateType) {
      updatedPhases = setStatusForPhase(updatedPhases, nextPhaseName, "Started");
      updatedDates = setDateInBundleDates(updatedDates, nextPhaseStartDateType, now);
    }

    setSimulationState({ phases: updatedPhases, bundleDates: updatedDates });
  };

  // Generic function to skip a phase
  const skipPhase = (
    phaseName: PhaseName,
    completionDateType: DateType,
    nextPhaseName: PhaseName,
    nextPhaseStartDateType: DateType
  ) => {
    const now = new Date();
    let updatedPhases = setStatusForPhase(simulationState.phases, phaseName, "Skipped");
    let updatedDates = setDateInBundleDates(simulationState.bundleDates, completionDateType, now);

    // Start next phase
    updatedPhases = setStatusForPhase(updatedPhases, nextPhaseName, "Started");
    updatedDates = setDateInBundleDates(updatedDates, nextPhaseStartDateType, now);

    setSimulationState({ phases: updatedPhases, bundleDates: updatedDates });
  };

  // Generic function to submit a change on a phase
  const submitChange = (
    phaseName: PhaseName,
    dateToSet?: DateType,
    autoStartPhase: boolean = true
  ) => {
    const now = new Date();
    let updatedPhases = simulationState.phases;
    let updatedDates = simulationState.bundleDates;

    // Auto-start the phase if it's not started and autoStartPhase is true
    const phaseStatus = getStatusForPhase(updatedPhases, phaseName);
    if (autoStartPhase && phaseStatus === "Not Started") {
      const startDateType = `${phaseName} Start Date` as DateType;
      updatedPhases = setStatusForPhase(updatedPhases, phaseName, "Started");
      updatedDates = setDateInBundleDates(updatedDates, startDateType, now);
    }

    // Set the specified date if provided
    if (dateToSet) {
      updatedDates = setDateInBundleDates(updatedDates, dateToSet, now);
    }

    // Business Rule: State Application submission triggers special logic
    if (phaseName === "State Application") {
      // If Concept is still "Not Started" or "Started", mark it as completed
      const conceptStatus = getStatusForPhase(updatedPhases, "Concept");
      if (conceptStatus === "Not Started" || conceptStatus === "Started") {
        updatedPhases = setStatusForPhase(updatedPhases, "Concept", "Completed");
        updatedDates = setDateInBundleDates(updatedDates, "Concept Completion Date", now);
      }

      // Completeness starts as soon as State Application Submitted Date is populated
      if (dateToSet === "State Application Submitted Date") {
        const completenessStatus = getStatusForPhase(updatedPhases, "Completeness");
        if (completenessStatus === "Not Started") {
          updatedPhases = setStatusForPhase(updatedPhases, "Completeness", "Started");
          updatedDates = setDateInBundleDates(updatedDates, "Completeness Start Date", now);
        }
      }
    }

    setSimulationState({ phases: updatedPhases, bundleDates: updatedDates });
  };

  // Business Rule: Create Demonstration starts Concept Phase
  const createDemonstration = () => {
    startPhase("Concept", "Concept Start Date");
    setDemonstrationCreated(true);
  };

  // Business Rule: Finish State Application Phase
  const finishStateApplicationPhase = () => {
    let updatedPhases = setStatusForPhase(simulationState.phases, "State Application", "Completed");
    const updatedDates = setDateInBundleDates(
      simulationState.bundleDates,
      "State Application Completion Date",
      new Date()
    );

    // Business Rule: If Concept was skipped, mark it completed now
    const conceptStatus = getStatusForPhase(updatedPhases, "Concept");
    if (conceptStatus === "Skipped") {
      updatedPhases = setStatusForPhase(updatedPhases, "Concept", "Completed");
    }

    setSimulationState({ phases: updatedPhases, bundleDates: updatedDates });
  };

  const resetSimulation = () => {
    setSimulationState(DEFAULT_SIMULATION_STATE);
    setDemonstrationCreated(false);
  };

  const getDateDisplay = (dateType: DateType) => {
    const date = getDateFromBundleDates(simulationState.bundleDates, dateType);
    return date ? formatDateTime(date, "millisecond") : "Not set";
  };

  const isStateApplicationSubmittedDateSet = () => {
    const submittedDate = getDateFromBundleDates(
      simulationState.bundleDates,
      "State Application Submitted Date"
    );
    return submittedDate !== null;
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
                getStatusForPhase(simulationState.phases, "Concept") || "Not Started"
              )}
            >
              <div>
                <div className={STYLES.phaseTitle}>Concept Phase</div>
                <div className={STYLES.phaseStatus}>
                  Status: {getStatusForPhase(simulationState.phases, "Concept")}
                </div>

                <div className={STYLES.dateDisplay}>
                  Start Date: {getDateDisplay("Concept Start Date")}
                </div>
                <div className={STYLES.dateDisplay}>
                  Completion Date: {getDateDisplay("Concept Completion Date")}
                </div>
              </div>

              {getStatusForPhase(simulationState.phases, "Concept") === "Started" && (
                <div className="flex gap-2 mt-4">
                  <Button
                    name="finish-concept"
                    onClick={() =>
                      completePhase(
                        "Concept",
                        "Concept Completion Date",
                        "State Application",
                        "State Application Start Date"
                      )
                    }
                    size="small"
                  >
                    Finish
                  </Button>
                  <SecondaryButton
                    name="skip-concept"
                    onClick={() =>
                      skipPhase(
                        "Concept",
                        "Concept Completion Date",
                        "State Application",
                        "State Application Start Date"
                      )
                    }
                    size="small"
                  >
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
                getStatusForPhase(simulationState.phases, "State Application") || "Not Started"
              )}
            >
              <div>
                <div className={STYLES.phaseTitle}>State Application</div>
                <div className={STYLES.phaseStatus}>
                  Status: {getStatusForPhase(simulationState.phases, "State Application")}
                </div>

                <div className={STYLES.dateDisplay}>
                  Start Date: {getDateDisplay("State Application Start Date")}
                </div>
                <div className={STYLES.dateDisplay}>
                  Submitted Date: {getDateDisplay("State Application Submitted Date")}
                </div>
                <div className={STYLES.dateDisplay}>
                  Completion Date: {getDateDisplay("State Application Completion Date")}
                </div>
              </div>

              {(getStatusForPhase(simulationState.phases, "State Application") === "Started" ||
                getStatusForPhase(simulationState.phases, "State Application") ===
                  "Not Started") && (
                <div className="flex gap-2 mt-4">
                  {getStatusForPhase(simulationState.phases, "State Application") === "Started" && (
                    <Button
                      name="finish-state-app"
                      onClick={finishStateApplicationPhase}
                      size="small"
                      disabled={!isStateApplicationSubmittedDateSet()}
                    >
                      Finish
                    </Button>
                  )}
                  <SecondaryButton
                    name="submit-change"
                    onClick={() =>
                      submitChange("State Application", "State Application Submitted Date")
                    }
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
                getStatusForPhase(simulationState.phases, "Completeness") || "Not Started"
              )}
            >
              <div>
                <div className={STYLES.phaseTitle}>Completeness</div>
                <div className={STYLES.phaseStatus}>
                  Status: {getStatusForPhase(simulationState.phases, "Completeness")}
                </div>

                <div className={STYLES.dateDisplay}>
                  Start Date: {getDateDisplay("Completeness Start Date")}
                </div>
                <div className={STYLES.dateDisplay}>
                  Completion Date: {getDateDisplay("Completeness Completion Date")}
                </div>
              </div>

              {(getStatusForPhase(simulationState.phases, "Completeness") === "Started" ||
                getStatusForPhase(simulationState.phases, "Completeness") === "Not Started") && (
                <div className="flex gap-2 mt-4">
                  {getStatusForPhase(simulationState.phases, "Completeness") === "Started" && (
                    <Button
                      name="finish-completeness"
                      onClick={() => completePhase("Completeness", "Completeness Completion Date")}
                      size="small"
                    >
                      Finish
                    </Button>
                  )}
                  <SecondaryButton
                    name="submit-change-completeness"
                    onClick={() => submitChange("Completeness")}
                    size="small"
                  >
                    Submit Change (Document/Date)
                  </SecondaryButton>
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
