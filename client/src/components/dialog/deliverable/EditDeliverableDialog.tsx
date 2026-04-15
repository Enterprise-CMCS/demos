import React, { useState } from "react";
import { gql, useQuery } from "@apollo/client";

import { Button } from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";
import { TextInput } from "components/input";
import { useToast } from "components/toast";
import { DeliverableType, DeliverableStatus, Tag } from "demos-server";
import { format } from "date-fns";
import { DELIVERABLE_UPDATED_MESSAGE } from "util/messages";

import { CMSOwnerField } from "./fields/CMSOwnerField";
import { DeliverableNameField } from "./fields/DeliverableNameField";
import { DeliverableTypeField } from "./fields/DeliverableTypeField";
import { DemonstrationTypeField } from "./fields/DemonstrationTypeField";
import { SingleDeliverableScheduleType } from "./fields/schedule-type/SingleDeliverableScheduleType";

export const EDIT_DELIVERABLE_DIALOG_TITLE = "Edit Deliverable";
export const EDIT_DELIVERABLE_DIALOG_NAME = "edit-deliverable-dialog";
export const EDIT_DELIVERABLE_SAVE_BUTTON_NAME = "button-edit-deliverable-confirm";
export const EDIT_DELIVERABLE_REASON_FIELD_NAME = "edit-deliverable-reason";

export const NON_EDITABLE_DELIVERABLE_STATUSES: ReadonlySet<DeliverableStatus> = new Set([
  "Accepted",
  "Approved",
  "Received and Filed",
]);

export const isDeliverableEditable = (status: DeliverableStatus): boolean =>
  !NON_EDITABLE_DELIVERABLE_STATUSES.has(status);

export interface EditDeliverableInput {
  id: string;
  name: string;
  deliverableType: DeliverableType;
  cmsOwnerUserId: string;
  dueDate: string;
  demonstrationTypes: string[];
}

export interface EditDeliverableDialogDeliverable {
  id: string;
  name: string;
  deliverableType: DeliverableType;
  dueDate: Date;
  cmsOwner: { id: string };
  demonstration: { id: string };
}

export const EDIT_DELIVERABLE_DEMO_TYPES_QUERY = gql`
  query EditDeliverableDemonstrationTypes($id: ID!) {
    demonstration(id: $id) {
      id
      demonstrationTypes {
        demonstrationTypeName
        approvalStatus
      }
    }
  }
`;

type DemonstrationTypesQueryResult = {
  demonstration: {
    id: string;
    demonstrationTypes: {
      demonstrationTypeName: string;
      approvalStatus: Tag["approvalStatus"];
    }[];
  } | null;
};

export interface EditDeliverableFormData {
  name: string;
  cmsOwnerUserId: string;
  dueDate: string;
  demonstrationTypes: string[];
  reasonForChange: string;
}

const toIsoDate = (date: Date): string => format(date, "yyyy-MM-dd");

export const buildInitialFormData = (
  deliverable: EditDeliverableDialogDeliverable
): EditDeliverableFormData => ({
  name: deliverable.name,
  cmsOwnerUserId: deliverable.cmsOwner.id,
  dueDate: toIsoDate(deliverable.dueDate),
  demonstrationTypes: [],
  reasonForChange: "",
});

export const dueDateChanged = (initialDueDate: string, currentDueDate: string): boolean =>
  initialDueDate !== currentDueDate;

export const formIsValid = (
  initial: EditDeliverableFormData,
  current: EditDeliverableFormData
): boolean => {
  const requiredOk =
    current.name.trim().length > 0 &&
    current.cmsOwnerUserId.length > 0 &&
    current.demonstrationTypes.length > 0;

  if (!requiredOk) return false;

  if (dueDateChanged(initial.dueDate, current.dueDate)) {
    return current.reasonForChange.trim().length > 0;
  }

  return true;
};

export const formHasChanges = (
  initial: EditDeliverableFormData,
  current: EditDeliverableFormData
): boolean =>
  initial.name !== current.name ||
  initial.cmsOwnerUserId !== current.cmsOwnerUserId ||
  initial.dueDate !== current.dueDate ||
  initial.demonstrationTypes.length !== current.demonstrationTypes.length ||
  initial.demonstrationTypes.some((type, i) => current.demonstrationTypes[i] !== type) ||
  current.reasonForChange.trim().length > 0;

export interface EditDeliverableDialogProps {
  onClose: () => void;
  deliverable: EditDeliverableDialogDeliverable;
  demonstrationTypeTags?: Tag[];
  onSave?: (input: EditDeliverableInput, reasonForChange?: string) => Promise<void> | void;
}

export const EditDeliverableDialog: React.FC<EditDeliverableDialogProps> = ({
  onClose,
  deliverable,
  demonstrationTypeTags,
  onSave,
}) => {
  const { showSuccess } = useToast();

  const { data: demoTypesData } = useQuery<DemonstrationTypesQueryResult>(
    EDIT_DELIVERABLE_DEMO_TYPES_QUERY,
    {
      variables: { id: deliverable.demonstration.id },
      skip: demonstrationTypeTags !== undefined,
    }
  );

  const resolvedTags: Tag[] =
    demonstrationTypeTags ??
    demoTypesData?.demonstration?.demonstrationTypes.map((dt) => ({
      tagName: dt.demonstrationTypeName,
      approvalStatus: dt.approvalStatus,
    })) ??
    [];

  const initialFormData = buildInitialFormData(deliverable);
  const [formData, setFormData] = useState<EditDeliverableFormData>(initialFormData);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const dueDateWasChanged = dueDateChanged(initialFormData.dueDate, formData.dueDate);
  const isFormValid = formIsValid(initialFormData, formData);
  const hasChanges = formHasChanges(initialFormData, formData);

  const reasonInvalid =
    attemptedSubmit && dueDateWasChanged && formData.reasonForChange.trim().length === 0;

  const handleSave = async () => {
    setAttemptedSubmit(true);
    if (!isFormValid) return;

    await onSave?.(
      {
        id: deliverable.id,
        name: formData.name.trim(),
        deliverableType: deliverable.deliverableType,
        cmsOwnerUserId: formData.cmsOwnerUserId,
        dueDate: formData.dueDate,
        demonstrationTypes: formData.demonstrationTypes,
      },
      dueDateWasChanged ? formData.reasonForChange.trim() : undefined
    );

    showSuccess(DELIVERABLE_UPDATED_MESSAGE);
    onClose();
  };

  return (
    <BaseDialog
      name={EDIT_DELIVERABLE_DIALOG_NAME}
      title={EDIT_DELIVERABLE_DIALOG_TITLE}
      onClose={onClose}
      dialogHasChanges={hasChanges}
      maxWidthClass="max-w-[960px]"
      actionButton={
        <Button
          name={EDIT_DELIVERABLE_SAVE_BUTTON_NAME}
          onClick={handleSave}
          disabled={!isFormValid}
        >
          Save Changes
        </Button>
      }
    >
      <div className="flex flex-col gap-sm">
        <div className="grid grid-cols-2 gap-sm">
          <DeliverableTypeField
            value={deliverable.deliverableType}
            onSelect={() => {}}
            isDisabled
          />
          <SingleDeliverableScheduleType
            value={formData.dueDate}
            onChange={(dueDate) => setFormData((prev) => ({ ...prev, dueDate }))}
          />
        </div>
        <DeliverableNameField
          value={formData.name}
          onChange={(name) => setFormData((prev) => ({ ...prev, name }))}
        />
        <div className="grid grid-cols-2 gap-sm">
          <CMSOwnerField
            value={formData.cmsOwnerUserId}
            onSelect={(cmsOwnerId) =>
              setFormData((prev) => ({ ...prev, cmsOwnerUserId: cmsOwnerId }))
            }
          />
          <DemonstrationTypeField
            demonstrationTypeTags={resolvedTags}
            selectedValues={formData.demonstrationTypes}
            onSelect={(selectedTypes) =>
              setFormData((prev) => ({ ...prev, demonstrationTypes: selectedTypes }))
            }
            isRequired
          />
        </div>
        {dueDateWasChanged && (
          <TextInput
            name={EDIT_DELIVERABLE_REASON_FIELD_NAME}
            label="Reason for Change"
            isRequired
            placeholder="Provide a reason for changing the due date"
            value={formData.reasonForChange}
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, reasonForChange: event.target.value }))
            }
            getValidationMessage={(value) =>
              reasonInvalid && value.trim() === ""
                ? "Reason for Change is required when the due date is modified."
                : ""
            }
          />
        )}
      </div>
    </BaseDialog>
  );
};
