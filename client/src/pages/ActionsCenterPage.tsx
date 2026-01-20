import React from "react";
import { Button } from "components/button";
import {
  EmptyIcon,
  OnHoldIcon,
  PreSubmissionIcon,
  ReviewIcon,
  SuccessInvertedIcon,
  WithdrawnIcon,
} from "components/icons";

interface StatusDefinition {
  id: string;
  label: string;
  description: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const STATUSES: StatusDefinition[] = [
  {
    id: "status-pre-submission",
    label: "Pre-submission",
    description: "Concepts and materials that are in the pre-submission phase.",
    Icon: PreSubmissionIcon,
  },
  {
    id: "status-under-review",
    label: "Under Review",
    description: "Demonstrations that are actively being reviewed.",
    Icon: ReviewIcon,
  },
  {
    id: "status-approved",
    label: "Approved",
    description: "Demonstrations that have received formal approval.",
    Icon: SuccessInvertedIcon,
  },
  {
    id: "status-denied",
    label: "Denied",
    description: "Demonstrations that have not been approved.",
    Icon: EmptyIcon,
  },
  {
    id: "status-on-hold",
    label: "On Hold",
    description: "Demonstrations that are temporarily paused.",
    Icon: OnHoldIcon,
  },
  {
    id: "status-withdrawn",
    label: "Withdrawn",
    description: "Demonstrations that have been withdrawn by the submitter.",
    Icon: WithdrawnIcon,
  },
];

export const ActionsCenterPage: React.FC = () => {
  const handleClick = (actionId: string) => {
    // Placeholder handler so actions are interactive; real flows will be wired later.
    return actionId;
  };

  return (
    <div className="shadow-md bg-white p-[16px]">
      <h1 className="text-[20px] font-bold mb-[24px] text-brand uppercase border-b-1 pb-[8px]">
        Actions Center
      </h1>
      <p className="mb-4 text-sm text-text-secondary">
        Review demonstration statuses below. Each status provides quick context about where a
        demonstration is in the process.
      </p>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {STATUSES.map(({ id, label, description, Icon }) => (
          <div
            key={id}
            className="flex flex-col gap-2 border border-border-subtle rounded-md p-3 bg-surface-secondary hover:border-border-strong focus-within:border-focus"
          >
            <div className="flex items-center gap-2">
              <span
                className={
                  {
                    "status-pre-submission": "text-text-placeholder",
                    "status-under-review": "text-border-alert",
                    "status-approved": "text-border-success",
                    "status-denied": "text-error",
                    "status-on-hold": "text-text-placeholder",
                    "status-withdrawn": "text-text-placeholder",
                  }[id] + " flex items-center justify-center w-10 h-10"
                }
              >
                <Icon width={32} height={32} />
              </span>
              <span className="font-semibold text-sm">{label}</span>
            </div>
            <p className="text-xs text-text-secondary flex-1">{description}</p>
            <div className="mt-1">
              <Button type="button" size="small" name={id} onClick={() => handleClick(id)}>
                View {label} details
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
