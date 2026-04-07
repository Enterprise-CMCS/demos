import React, { useState } from "react";

import { Button } from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";
import { CMSOwnerField } from "./fields/CMSOwnerField";
import { DeliverableNameField } from "./fields/DeliverableNameField";
import { DeliverableTypeField } from "./fields/DeliverableTypeField";
import { DemonstrationTypeField } from "./fields/DemonstrationTypeField";
import { ScheduleType, ScheduleTypeField } from "./fields/schedule-type/ScheduleTypeField";
import { SingleDeliverableScheduleType } from "./fields/schedule-type/SingleDeliverableScheduleType";
import { QuarterlyDeliverableSchedule } from "./fields/schedule-type/QuarterlyDeliverableSchedule";
import { Demonstration } from "demos-server";
import { useToast } from "components/toast";
import { DELIVERABLE_SLOTS_CREATED_MESSAGE } from "util/messages";

export const ADD_DELIVERABLE_SLOT_DIALOG_TITLE = "Add New Deliverable Slot(s)";
export const ADD_DELIVERABLE_SLOT_DIALOG_NAME = "add-deliverable-slot-dialog";
export const ADD_DELIVERABLE_SLOT_SAVE_BUTTON_NAME = "button-add-deliverable-slot-confirm";

const ALL_QUARTERS = [1, 2, 3, 4] as const;
type Quarter = (typeof ALL_QUARTERS)[number];

// If the deliverable type is Implementation Plan or Monitoring Protocol, then at least one demonstration type must be selected
const requiresDemonstrationTypes = (deliverableType: string): boolean =>
  (["Implementation Plan", "Monitoring Protocol"] as readonly string[]).includes(deliverableType);

interface AddDeliverableSlotFormData {
  deliverableName: string;
  cmsOwnerId: string;
  deliverableType: string;
  scheduleType: ScheduleType;
  demonstrationTypes: string[];
}

const INITIAL_FORM_DATA: AddDeliverableSlotFormData = {
  deliverableName: "",
  cmsOwnerId: "",
  deliverableType: "",
  scheduleType: "Single",
  demonstrationTypes: [],
};

export const getQuarterlyDeliverableSlotName = (
  demonstrationYear: number,
  quarter: Quarter,
  deliverableName: string
): string => `DY${demonstrationYear}Q${quarter} ${deliverableName}`;

export const buildAddDeliverableSlotPayloads = (
  demonstrationYear: number,
  formData: AddDeliverableSlotFormData
): AddDeliverableSlotFormData[] => {
  if (formData.scheduleType === "Single") {
    return [formData];
  }

  return ALL_QUARTERS.map((quarter) => ({
    ...formData,
    deliverableName: getQuarterlyDeliverableSlotName(
      demonstrationYear,
      quarter,
      formData.deliverableName
    ),
  }));
};

const formIsValid = (data: AddDeliverableSlotFormData): boolean =>
  data.deliverableName.trim().length > 0 &&
  data.cmsOwnerId.length > 0 &&
  data.deliverableType.length > 0 &&
  data.scheduleType.length > 0 &&
  (!requiresDemonstrationTypes(data.deliverableType) || data.demonstrationTypes.length > 0);

const formHasChanges = (data: AddDeliverableSlotFormData): boolean =>
  data.deliverableName !== INITIAL_FORM_DATA.deliverableName ||
  data.cmsOwnerId !== INITIAL_FORM_DATA.cmsOwnerId ||
  data.deliverableType !== INITIAL_FORM_DATA.deliverableType ||
  data.demonstrationTypes.length !== 0;

export type AddDeliverableSlotDemonstration = Pick<
  Demonstration,
  "effectiveDate" | "expirationDate"
> & {
  demonstrationTypes: string[];
};

export const AddDeliverableSlotDialog = ({
  onClose,
  demonstration,
}: {
  onClose: () => void;
  demonstration: AddDeliverableSlotDemonstration;
}) => {
  const { showSuccess } = useToast();

  const [formData, setFormData] = useState<AddDeliverableSlotFormData>(INITIAL_FORM_DATA);
  const [demonstrationYear, setDemonstrationYear] = useState<number>(1);

  const isFormValid = formIsValid(formData);
  const hasFormChanges = formHasChanges(formData);

  return (
    <BaseDialog
      name={ADD_DELIVERABLE_SLOT_DIALOG_NAME}
      title={ADD_DELIVERABLE_SLOT_DIALOG_TITLE}
      onClose={onClose}
      dialogHasChanges={hasFormChanges}
      maxWidthClass="max-w-[960px]"
      actionButton={
        <Button
          name={ADD_DELIVERABLE_SLOT_SAVE_BUTTON_NAME}
          onClick={() => {
            // For now log out the payload that would be sent to the backend.
            // In the future, this is where the API call to create deliverable slots would go
            const payloads = buildAddDeliverableSlotPayloads(demonstrationYear, formData);
            console.log(payloads);
            showSuccess(DELIVERABLE_SLOTS_CREATED_MESSAGE);
            onClose();
          }}
          disabled={!isFormValid}
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
        {formData.scheduleType === "Quarterly" && (
          <QuarterlyDeliverableSchedule
            demonstrationEffectiveDate={demonstration.effectiveDate}
            demonstrationExpirationDate={demonstration.expirationDate}
            onSelectYear={(demonstrationYear) => setDemonstrationYear(demonstrationYear)}
          />
        )}
        {formData.scheduleType === "Single" && <SingleDeliverableScheduleType />}
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
            options={demonstration.demonstrationTypes}
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
