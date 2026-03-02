import React from "react";
import { ApplicationStatusBadge } from "components/badge/ApplicationStatusBadge";
import { PhaseSelector, WorkflowApplication } from "components/application";

// Removing next PR, just for compilation
const mockApplication: WorkflowApplication = {
  id: "1",
  currentPhaseName: "Concept",
  phases: [],
  documents: [],
  tags: [],
  clearanceLevel: "COMMs",
};

export const AmendmentWorkflow = () => {
  return (
    <div className="flex flex-col gap-sm p-sm">
      <div className="flex w-full">
        <h3 className="text-brand text-2xl font-bold">APPLICATION</h3>
        <ApplicationStatusBadge applicationStatus={"Approved"} />
      </div>
      <hr className="text-border-rules" />
      <PhaseSelector application={mockApplication} />
    </div>
  );
};
