import React, { useState } from "react";
import { Button, SecondaryButton, WarningButton } from "components/button";

interface SimulationState {
  // Application creation
  applicationCreatedAt: Date | null;

  // Concept phase
  conceptSkipped: boolean;
  conceptFinished: boolean;
  conceptFinishDate: Date | null;

  // State Application phase
  stateAppStarted: boolean;
  stateAppStartDate: Date | null;
  stateAppSubmittedDate: Date | null;
  stateAppFinished: boolean;
  stateAppFinishDate: Date | null;

  // Completeness phase
  completenessStarted: boolean;
  completenessStartDate: Date | null;
  completenessFinished: boolean;
  completenessFinishDate: Date | null;
}

export const ApplicationDatesFlowchart: React.FC = () => {
  const [simulation, setSimulation] = useState<SimulationState>({
    applicationCreatedAt: null,
    conceptSkipped: false,
    conceptFinished: false,
    conceptFinishDate: null,
    stateAppStarted: false,
    stateAppStartDate: null,
    stateAppSubmittedDate: null,
    stateAppFinished: false,
    stateAppFinishDate: null,
    completenessStarted: false,
    completenessStartDate: null,
    completenessFinished: false,
    completenessFinishDate: null,
  });

  const reset = () => {
    setSimulation({
      applicationCreatedAt: null,
      conceptSkipped: false,
      conceptFinished: false,
      conceptFinishDate: null,
      stateAppStarted: false,
      stateAppStartDate: null,
      stateAppSubmittedDate: null,
      stateAppFinished: false,
      stateAppFinishDate: null,
      completenessStarted: false,
      completenessStartDate: null,
      completenessFinished: false,
      completenessFinishDate: null,
    });
  };

  const createApplication = () => {
    const now = new Date();
    setSimulation((prev) => ({
      ...prev,
      applicationCreatedAt: now,
    }));
  };

  const skipConcept = () => {
    const now = new Date();
    setSimulation((prev) => ({
      ...prev,
      conceptSkipped: true,
      conceptFinishDate: now,
      stateAppStarted: true,
      stateAppStartDate: now,
    }));
  };

  const finishConcept = () => {
    const now = new Date();
    setSimulation((prev) => ({
      ...prev,
      conceptFinished: true,
      conceptFinishDate: now,
      stateAppStarted: true,
      stateAppStartDate: now,
    }));
  };

  const submitStateApplication = () => {
    const now = new Date();
    setSimulation((prev) => ({
      ...prev,
      stateAppSubmittedDate: now,
      completenessStarted: true,
      completenessStartDate: now,
    }));
  };

  const finishStateApplication = () => {
    const now = new Date();
    setSimulation((prev) => ({
      ...prev,
      stateAppFinished: true,
      stateAppFinishDate: now,
      // If concept was not finished, mark it as finished now
      conceptFinished: prev.conceptFinished || prev.conceptSkipped ? prev.conceptFinished : true,
      conceptFinishDate: prev.conceptFinishDate || now,
    }));
  };

  const finishCompleteness = () => {
    const now = new Date();
    setSimulation((prev) => ({
      ...prev,
      completenessFinished: true,
      completenessFinishDate: now,
    }));
  };

  const formatDateTime = (date: Date | null) => {
    if (!date) return "Not set";
    // eslint-disable-next-line no-nonstandard-date-formatting/no-nonstandard-date-formatting
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const getPhaseStatus = (started: boolean, finished: boolean, skipped?: boolean) => {
    if (skipped) return "Skipped";
    if (finished) return "Completed";
    if (started) return "In Progress";
    return "Not Started";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "text-green-600 bg-green-50";
      case "Skipped":
        return "text-yellow-600 bg-yellow-50";
      case "In Progress":
        return "text-blue-600 bg-blue-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Application Dates Flowchart Simulator</h1>
        <p className="text-gray-600 mb-4">
          Simulate the application workflow and see how dates are calculated according to the
          business rules.
        </p>

        <div className="flex gap-2 mb-6">
          <WarningButton name="reset" onClick={reset}>
            Reset Simulation
          </WarningButton>
        </div>
      </div>

      {/* Application Creation */}
      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">1. Application Creation</h2>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Button
              name="create-app"
              onClick={createApplication}
              disabled={!!simulation.applicationCreatedAt}
            >
              Create Application
            </Button>
            <span className="text-sm text-gray-600">
              {simulation.applicationCreatedAt
                ? `Created: ${formatDateTime(simulation.applicationCreatedAt)}`
                : "Click to create application"}
            </span>
          </div>

          {simulation.applicationCreatedAt && (
            <div className="p-3 bg-blue-50 rounded">
              <p className="font-medium text-blue-800">📋 Concept Phase Started</p>
              <p className="text-sm text-blue-600">
                Start Date: {formatDateTime(simulation.applicationCreatedAt)} (UTC)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Concept Phase */}
      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">2. Concept Phase</h2>
        <div className="flex flex-col gap-4">
          <div
            className={`p-3 rounded ${getStatusColor(getPhaseStatus(!!simulation.applicationCreatedAt, simulation.conceptFinished || simulation.conceptSkipped, simulation.conceptSkipped))}`}
          >
            <p className="font-medium">
              Status:{" "}
              {getPhaseStatus(
                !!simulation.applicationCreatedAt,
                simulation.conceptFinished || simulation.conceptSkipped,
                simulation.conceptSkipped
              )}
            </p>
            {simulation.applicationCreatedAt && (
              <p className="text-sm">Start: {formatDateTime(simulation.applicationCreatedAt)}</p>
            )}
            {simulation.conceptFinishDate && (
              <p className="text-sm">End: {formatDateTime(simulation.conceptFinishDate)}</p>
            )}
          </div>

          <div className="flex gap-2">
            <SecondaryButton
              name="skip-concept"
              onClick={skipConcept}
              disabled={
                !simulation.applicationCreatedAt ||
                simulation.conceptSkipped ||
                simulation.conceptFinished
              }
            >
              Skip Concept
            </SecondaryButton>
            <Button
              name="finish-concept"
              onClick={finishConcept}
              disabled={
                !simulation.applicationCreatedAt ||
                simulation.conceptSkipped ||
                simulation.conceptFinished
              }
            >
              Finish Concept
            </Button>
          </div>
        </div>
      </div>

      {/* State Application Phase */}
      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">3. State Application Phase</h2>
        <div className="flex flex-col gap-4">
          <div
            className={`p-3 rounded ${getStatusColor(getPhaseStatus(simulation.stateAppStarted, simulation.stateAppFinished))}`}
          >
            <p className="font-medium">
              Status: {getPhaseStatus(simulation.stateAppStarted, simulation.stateAppFinished)}
            </p>
            {simulation.stateAppStartDate && (
              <p className="text-sm">Start: {formatDateTime(simulation.stateAppStartDate)}</p>
            )}
            {simulation.stateAppSubmittedDate && (
              <p className="text-sm">
                Submitted: {formatDateTime(simulation.stateAppSubmittedDate)}
              </p>
            )}
            {simulation.stateAppFinishDate && (
              <p className="text-sm">End: {formatDateTime(simulation.stateAppFinishDate)}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              name="submit-state-app"
              onClick={submitStateApplication}
              disabled={!simulation.stateAppStarted || !!simulation.stateAppSubmittedDate}
            >
              Submit State Application
            </Button>
            <Button
              name="finish-state-app"
              onClick={finishStateApplication}
              disabled={!simulation.stateAppStarted || simulation.stateAppFinished}
            >
              Finish State Application
            </Button>
          </div>
        </div>
      </div>

      {/* Completeness Phase */}
      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">4. Completeness Phase</h2>
        <div className="flex flex-col gap-4">
          <div
            className={`p-3 rounded ${getStatusColor(getPhaseStatus(simulation.completenessStarted, simulation.completenessFinished))}`}
          >
            <p className="font-medium">
              Status:{" "}
              {getPhaseStatus(simulation.completenessStarted, simulation.completenessFinished)}
            </p>
            {simulation.completenessStartDate && (
              <p className="text-sm">Start: {formatDateTime(simulation.completenessStartDate)}</p>
            )}
            {simulation.completenessFinishDate && (
              <p className="text-sm">End: {formatDateTime(simulation.completenessFinishDate)}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              name="finish-completeness"
              onClick={finishCompleteness}
              disabled={!simulation.completenessStarted || simulation.completenessFinished}
            >
              Finish Completeness
            </Button>
          </div>

          {!simulation.completenessStarted && (
            <p className="text-sm text-gray-600">
              💡 This phase starts automatically when State Application is submitted
            </p>
          )}
        </div>
      </div>

      {/* Rules Summary */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Business Rules Summary</h3>
        <div className="space-y-2 text-sm">
          <div>
            <strong>Concept Phase:</strong> Starts when application is created. Ends when Skip or
            Finish is clicked.
          </div>
          <div>
            <strong>State Application Phase:</strong> Starts when Concept is skipped/finished OR
            when changes are submitted. Ends when Finish is clicked.
          </div>
          <div>
            <strong>Completeness Phase:</strong> Starts when State Application is submitted OR when
            changes are submitted. Ends when Finish is clicked.
          </div>
          <div>
            <strong>Special Rule:</strong> If Concept is not finished when State Application
            finishes, Concept is automatically marked as completed.
          </div>
        </div>
      </div>

      {/* Current State Summary */}
      {simulation.applicationCreatedAt && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Current Simulation State</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Concept Phase</strong>
              <p>
                Status:{" "}
                {getPhaseStatus(
                  !!simulation.applicationCreatedAt,
                  simulation.conceptFinished || simulation.conceptSkipped,
                  simulation.conceptSkipped
                )}
              </p>
              <p>Start: {formatDateTime(simulation.applicationCreatedAt)}</p>
              <p>End: {formatDateTime(simulation.conceptFinishDate)}</p>
            </div>
            <div>
              <strong>State Application Phase</strong>
              <p>
                Status: {getPhaseStatus(simulation.stateAppStarted, simulation.stateAppFinished)}
              </p>
              <p>Start: {formatDateTime(simulation.stateAppStartDate)}</p>
              <p>End: {formatDateTime(simulation.stateAppFinishDate)}</p>
            </div>
            <div>
              <strong>Completeness Phase</strong>
              <p>
                Status:{" "}
                {getPhaseStatus(simulation.completenessStarted, simulation.completenessFinished)}
              </p>
              <p>Start: {formatDateTime(simulation.completenessStartDate)}</p>
              <p>End: {formatDateTime(simulation.completenessFinishDate)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
