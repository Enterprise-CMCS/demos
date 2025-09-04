import React from "react";
import { PhaseSelector } from "./phase-selector/PhaseSelector";
import { DemonstrationStatusBadge } from "./DemonstrationStatusBadge";

export type DemonstrationStatus = "under_review" | "approved" | "rejected";

export interface ApplicationWorkflowDemonstration {
  status: DemonstrationStatus;
}

export const ApplicationWorkflow = ({
  demonstration,
}: {
  demonstration: ApplicationWorkflowDemonstration;
}) => {
  return (
    <div className="flex flex-col gap-sm p-md">
      <div className="flex w-full">
        <h3 className="text-brand text-2xl font-bold">APPLICATION</h3>
        <DemonstrationStatusBadge demonstrationStatus={demonstration.status} />
      </div>
      <hr className="text-border-rules" />
      <PhaseSelector />
    </div>
  );
};
