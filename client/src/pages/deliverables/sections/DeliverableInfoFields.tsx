import React from "react";
import { DeliverableDetailsManagementDeliverable } from "../DeliverableDetailsManagementPage";
import { formatDate } from "util/formatDate";
import { SecondaryButton } from "components/button";
import { ChevronDownIcon, ChevronLeftIcon } from "components/icons";

export const DELIVERABLE_INFO_FIELDS_NAME = "deliverable-info-fields";
export const BACK_TO_DELIVERABLES_BUTTON_NAME = "button-back-to-deliverables";
const DUMMY_SUBMISSION_DATE = "01/05/2026";

export const DeliverableInfoFields = ({
  deliverable,
  onBack,
  title,
  showAdditionalDetailsToggle = false,
  showAdditionalDetails = false,
  onToggleAdditionalDetails,
}: {
  deliverable: DeliverableDetailsManagementDeliverable;
  onBack?: () => void;
  title?: string;
  showAdditionalDetailsToggle?: boolean;
  showAdditionalDetails?: boolean;
  onToggleAdditionalDetails?: () => void;
}) => {
  type DeliverableInfoField = {
    label:
      | "Deliverable Type"
      | "Due Date"
      | "Submission Date"
      | "Status"
      | "Extension"
      | "Resubmissions Requested"
      | "CMS Owner";
    value: string;
  };

  const baseFields: DeliverableInfoField[] = [
    { label: "Deliverable Type", value: deliverable.deliverableType },
    { label: "Due Date", value: formatDate(deliverable.dueDate) },
    { label: "Submission Date", value: DUMMY_SUBMISSION_DATE },
    { label: "Status", value: deliverable.status },
  ];
  const additionalFields: DeliverableInfoField[] = [
    { label: "Extension", value: "N/A" },
    { label: "Resubmissions Requested", value: "0" },
    { label: "CMS Owner", value: deliverable.cmsOwner.person.fullName },
  ];
  const shouldShowAdditionalDetails = !showAdditionalDetailsToggle || showAdditionalDetails;
  const displayFields: DeliverableInfoField[] = shouldShowAdditionalDetails
    ? [...baseFields, ...additionalFields]
    : baseFields;

  const VerticalRule = () => (
    <div className="text-[18px] mt-0.5 font-title font-normal opacity-70" aria-hidden="true">
      |
    </div>
  );

  return (
    <div className="flex items-start gap-1 min-w-0" data-testid={DELIVERABLE_INFO_FIELDS_NAME}>
      {onBack ? (
        <>
          <SecondaryButton
            size="small"
            type="button"
            name={BACK_TO_DELIVERABLES_BUTTON_NAME}
            onClick={onBack}
          >
            <span className="flex items-center gap-0.5">
              <ChevronLeftIcon height="12" width="12" />
            </span>
          </SecondaryButton>
        </>
      ) : null}
      <div className="flex flex-col gap-0.5 min-w-0">
        {title ? <h2 className="text-brand text-md font-bold">{title}</h2> : null}
        <div className="inline-flex flex-wrap items-center gap-1">
          {displayFields.map((field, index) => (
            <React.Fragment key={field.label}>
              <div className="text-[16px] mt-0.5 font-title">
                <span className="font-semibold">{field.label}: </span>
                <span className="font-normal" data-testid={`deliverable-${field.label}`}>
                  {field.value}
                </span>
              </div>
              {index < displayFields.length - 1 && <VerticalRule />}
            </React.Fragment>
          ))}
          {showAdditionalDetailsToggle ? (
            <>
              <VerticalRule />
              <button
                type="button"
                onClick={onToggleAdditionalDetails}
                className="inline-flex items-center gap-[4px] text-action underline underline-offset-2"
              >
                {showAdditionalDetails ? "Hide Additional Details" : "Show Additional Details"}
                <span
                  className={`transition-transform duration-200 ${
                    showAdditionalDetails ? "rotate-180" : "rotate-0"
                  }`}
                >
                  <ChevronDownIcon className="w-[10px] h-[10px]" />
                </span>
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
