import React from "react";

import { ErrorButton } from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";
import { ErrorIcon } from "components/icons";
import { TextInput } from "components/input";
import { Select, Option } from "components/input/select/Select";
import { tw } from "tags/tw";

const MESSAGE_ICON = tw`text-error flex items-start gap-2 text-sm`;
const FIELD_STACK = tw`mt-4 flex flex-col gap-4 md:flex-row`;
const FOOTER_SPACER = tw`mt-6`;

// Temporary options until we have real data.
const REASON_OPTIONS: Option[] = [
  { value: "missing-documentation", label: "Missing required documentation" },
  { value: "incomplete-submission", label: "Submission missing required fields" },
  { value: "pending-clarification", label: "Awaiting state clarification" },
  { value: "timeline-expired", label: "Submission exceeded review timeline" },
  { value: "other", label: "Other" },
];

// if other, a wild text box appears!
const OTHER_REASON_VALUE = "other";

export type DeclareIncompleteForm = {
  reason: string;
  otherText?: string;
};

type DeclareIncompleteDialogProps = {
  onClose: () => void;
  onConfirm?: (form: DeclareIncompleteForm) => void;
};

export const DeclareIncompleteDialog: React.FC<DeclareIncompleteDialogProps> = ({
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = React.useState("");
  const [otherText, setOtherText] = React.useState("");
  const [attemptedSubmit, setAttemptedSubmit] = React.useState(false);

  // pops the "other" explanation box
  const isOtherReason = reason === OTHER_REASON_VALUE;
  const trimmedOther = otherText.trim();
  const isValid = reason !== "" && (!isOtherReason || trimmedOther !== "");

  const handleConfirm = () => {
    setAttemptedSubmit(true);
    if (!isValid) return;

    onConfirm?.({ reason, otherText: isOtherReason ? trimmedOther : undefined });
    onClose();
  };

  const reasonError = attemptedSubmit && reason === "";

  return (
    <BaseDialog
      title="Declare Incomplete"
      onClose={onClose}
      dialogHasChanges={false}
      actionButton={
        <ErrorButton
          name="declare-incomplete-confirm"
          size="small"
          onClick={handleConfirm}
          disabled={!isValid}
        >
          Declare Incomplete
        </ErrorButton>
      }
    >
      <p className="text-base">
        Are you sure you want to declare this application process{" "}
        <span className="font-semibold">incomplete</span>?
      </p>

      <div className={MESSAGE_ICON}>
        <ErrorIcon className="mt-0.5" />
        <span>This application status will be changed to On-Hold</span>
      </div>

      <div className={FIELD_STACK}>
        <div className="flex-1">
          <Select
            id="declare-incomplete-reason"
            label="Reason"
            isRequired
            options={REASON_OPTIONS}
            value={reason}
            onSelect={(value) => setReason(value)}
          />
          {reasonError && <p className="mt-1 text-xs text-text-warn">Select a reason.</p>}
        </div>

        {isOtherReason && (
          <div className="flex-1">
            <TextInput
              name="declare-incomplete-other"
              label="Other"
              isRequired
              placeholder="Enter reason"
              value={otherText}
              onChange={(event) => setOtherText(event.target.value)}
              getValidationMessage={(value) =>
                attemptedSubmit && value.trim() === "" ? "Provide an explanation." : ""
              }
            />
          </div>
        )}
      </div>

      <div className={FOOTER_SPACER} />
    </BaseDialog>
  );
};
