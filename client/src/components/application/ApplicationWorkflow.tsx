import React from "react";
import { PhaseSelector } from "./phase-selector/PhaseSelector";
import { DemonstrationStatusBadge } from "./DemonstrationStatusBadge";
import { DEMONSTRATION_STATUSES } from "demos-server-constants";

type DemonstrationStatusId = (typeof DEMONSTRATION_STATUSES)[number]["id"];

export interface ApplicationWorkflowDemonstration {
  status: DemonstrationStatusId;
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
