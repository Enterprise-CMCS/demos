import React from "react";
import { ApplicationStatusBadge } from "components/badge/ApplicationStatusBadge";
import { PhaseSelector } from "components/application";
import { mockWorkflowApplication } from "mock-data";

export const ExtensionWorkflow = () => {
  return (
    <div className="flex flex-col gap-sm p-sm">
      <div className="flex w-full">
        <h3 className="text-brand text-2xl font-bold">APPLICATION</h3>
        <ApplicationStatusBadge applicationStatus={"Approved"} />
      </div>
      <hr className="text-border-rules" />
      <PhaseSelector application={mockWorkflowApplication} />
    </div>
  );
};
