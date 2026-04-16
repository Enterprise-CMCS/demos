import React from "react";
import { DeliverableDetailsManagementDeliverable } from "../DeliverableDetailsManagementPage";
import { formatDate } from "util/formatDate";

export const DELIVERABLE_INFO_FIELDS_NAME = "deliverable-info-fields";

export const DeliverableInfoFields = ({deliverable}: {deliverable: DeliverableDetailsManagementDeliverable}) => {
  const displayFields = [
    { label: "Deliverable Type", value: deliverable.deliverableType },
    { label: "Due Date", value: formatDate(deliverable.dueDate) },
    { label: "Submission Date", value: "—" },
    { label: "Status", value: deliverable.status },
  ];

  const VerticalRule = () => (
    <div className="text-[18px] mt-0.5 font-title font-normal opacity-70" aria-hidden="true">|</div>
  );

  return (
    <div className="inline-flex flex-wrap items-center gap-1" data-testid={DELIVERABLE_INFO_FIELDS_NAME}>
      {displayFields.map((field, index) => (
        <React.Fragment key={field.label}>
          <div className="text-[16px] mt-0.5 font-title">
            <span className="font-semibold">{field.label}:{" "}</span>
            <span className="font-normal" data-testid={`deliverable-${field.label}`}>
              {field.value}
            </span>
          </div>
          {index < displayFields.length - 1 && (<VerticalRule />)}
        </React.Fragment>
      ))}
    </div>
  );
};
