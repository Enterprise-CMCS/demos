import React, { useState } from "react";

import { Button } from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";
import { CMSOwnerField } from "./fields/CMSOwnerField";
import { DeliverableNameField } from "./fields/DeliverableNameField";
import { DeliverableTypeField } from "./fields/DeliverableTypeField";
import { DemonstrationTypeField } from "./fields/DemonstrationTypeField";
import { ScheduleTypeField } from "./fields/ScheduleTypeField";

export const ADD_DELIVERABLE_SLOT_DIALOG_TITLE = "Add New Deliverable Slot(s)";
export const ADD_DELIVERABLE_SLOT_DIALOG_NAME = "add-deliverable-slot-dialog";
export const ADD_DELIVERABLE_SLOT_SAVE_BUTTON_NAME = "button-add-deliverable-slot-confirm";

const DELIVERABLE_TYPES_REQUIRING_DEMONSTRATION_TYPE = ["Implementation Plan", "Monitoring Protocol"] as const;

const requiresDemonstrationTypes = (deliverableType: string): boolean =>
  (DELIVERABLE_TYPES_REQUIRING_DEMONSTRATION_TYPE as readonly string[]).includes(deliverableType);

interface AddDeliverableSlotFormData {
  deliverableName: string;
  cmsOwnerId: string;
  deliverableType: string;
  scheduleType: string;
  demonstrationTypes: string[];
}

const INITIAL_FORM_DATA: AddDeliverableSlotFormData = {
  deliverableName: "",
  cmsOwnerId: "",
  deliverableType: "",
  scheduleType: "",
  demonstrationTypes: [],
};

const checkFormIsValid = (data: AddDeliverableSlotFormData): boolean =>
  data.deliverableName.trim().length > 0 &&
  data.cmsOwnerId.length > 0 &&
  data.deliverableType.length > 0 &&
  data.scheduleType.length > 0 &&
  (!requiresDemonstrationTypes(data.deliverableType) || data.demonstrationTypes.length > 0);

const checkFormHasChanges = (data: AddDeliverableSlotFormData): boolean =>
  data.deliverableName !== INITIAL_FORM_DATA.deliverableName ||
  data.cmsOwnerId !== INITIAL_FORM_DATA.cmsOwnerId ||
  data.deliverableType !== INITIAL_FORM_DATA.deliverableType ||
  data.scheduleType !== INITIAL_FORM_DATA.scheduleType ||
  data.demonstrationTypes.length !== 0;

export const AddDeliverableSlotDialog = ({
  onClose,
  demonstrationTypes = [],
}: {
  onClose: () => void;
  demonstrationTypes?: string[];
}) => {
  const [formData, setFormData] = useState<AddDeliverableSlotFormData>(INITIAL_FORM_DATA);

  const formIsValid = checkFormIsValid(formData);
  const formHasChanges = checkFormHasChanges(formData);

  return (
    <BaseDialog
      name={ADD_DELIVERABLE_SLOT_DIALOG_NAME}
      title={ADD_DELIVERABLE_SLOT_DIALOG_TITLE}
      onClose={onClose}
      dialogHasChanges={formHasChanges}
      actionButton={
        <Button
          name={ADD_DELIVERABLE_SLOT_SAVE_BUTTON_NAME}
          onClick={onClose}
          disabled={!formIsValid}
        >
          Save
        </Button>
      }
    >
      <div className="flex flex-col gap-sm">
        <div className="grid grid-cols-2 gap-sm">
          <DeliverableTypeField
            value={formData.deliverableType}
            onSelect={(deliverableType) => setFormData((prev) => ({ ...prev, deliverableType }))}
          />

          <ScheduleTypeField
            value={formData.scheduleType}
            onSelect={(scheduleType) => setFormData((prev) => ({ ...prev, scheduleType }))}
          />
        </div>
        <DeliverableNameField
          value={formData.deliverableName}
          onChange={(deliverableName) => setFormData((prev) => ({ ...prev, deliverableName }))}
        />
        <div className="grid grid-cols-2 gap-sm">
          <CMSOwnerField
            value={formData.cmsOwnerId}
            onSelect={(cmsOwnerId) => setFormData((prev) => ({ ...prev, cmsOwnerId }))}
          />
          <DemonstrationTypeField
            options={demonstrationTypes}
            values={formData.demonstrationTypes}
            onSelect={(selectedTypes) =>
              setFormData((prev) => ({ ...prev, demonstrationTypes: selectedTypes }))
            }
            isRequired={requiresDemonstrationTypes(formData.deliverableType)}
          />
        </div>
      </div>
    </BaseDialog>
  );
};
