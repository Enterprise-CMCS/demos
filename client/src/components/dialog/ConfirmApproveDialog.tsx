import React from "react";

import { Button } from "components/button";
import { WorkflowApplicationType } from "components/application";
import { BaseDialog } from "./BaseDialog";
import { useDialog } from "./DialogContext";

interface ConfirmApproveDialogProps {
  onConfirm: () => void;
  applicationType: WorkflowApplicationType;
}

export const ConfirmApproveDialog: React.FC<ConfirmApproveDialogProps> = ({
  onConfirm,
  applicationType,
}) => {
  const { closeDialog } = useDialog();

  const handleSubmitClicked = () => {
    onConfirm();
    closeDialog();
  };

  return (
    <BaseDialog
      name="button-ca-dialog-close"
      title="ARE YOU SURE?"
      dialogHasChanges={false}
      onClose={closeDialog}
      maxWidthClass="max-w-[600px]"
      actionButton={
        <Button name="button-ca-dialog-approve" onClick={handleSubmitClicked}>
          Submit Approved {applicationType.charAt(0).toUpperCase() + applicationType.slice(1)}
        </Button>
      }
    >
      <div className="flex flex-col gap-1 items-start text-left">
        <span>
          Are you sure? By hitting accept you will be making the final submission of this approved{" "}
          {applicationType}.
          {applicationType === "demonstration" && (
            <>
              {" "}
              This will finalize the approval process and move the demonstration to the
              deliverables phase.
            </>
          )}
        </span>
      </div>
    </BaseDialog>
  );
};
