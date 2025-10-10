import React from "react";
import { PhaseSelector } from "./phase-selector/PhaseSelector";
import { DemonstrationStatusBadge } from "../badge/DemonstrationStatusBadge";
import type { Demonstration } from "demos-server";

export type ApplicationWorkflowDemonstration = Pick<
  Demonstration,
  "id" | "status" | "currentPhaseName"
>;

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
      <PhaseSelector demonstration={demonstration} />
    </div>
  );
};
