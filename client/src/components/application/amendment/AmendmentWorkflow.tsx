import React from "react";
import { ApplicationStatusBadge } from "components/badge/ApplicationStatusBadge";

export const AmendmentWorkflow = () => {
  return (
    <div className="flex flex-col gap-sm p-sm">
      <div className="flex w-full">
        <h3 className="text-brand text-2xl font-bold">APPLICATION</h3>
        <ApplicationStatusBadge applicationStatus={"Approved"} />
      </div>
      <hr className="text-border-rules" />
    </div>
  );
};
