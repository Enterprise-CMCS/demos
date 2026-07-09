import React, { useState } from "react";
import { gql, useMutation } from "@apollo/client";

import { Button } from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";
import { CMSOwnerField } from "./fields/CMSOwnerField";
import { DeliverableNameField } from "./fields/DeliverableNameField";
import { DeliverableTypeField } from "./fields/DeliverableTypeField";
import { DemonstrationTypeField } from "./fields/DemonstrationTypeField";
import { ScheduleType, ScheduleTypeField } from "./fields/schedule-type/ScheduleTypeField";
import { SingleDeliverableScheduleType } from "./fields/schedule-type/SingleDeliverableScheduleType";
import { QuarterlyDeliverableSchedule } from "./fields/schedule-type/QuarterlyDeliverableSchedule";
import {
  CreateDeliverableInput,
  DeliverableType,
  Demonstration,
  LocalDate,
  Tag,
} from "demos-server";
import { useToast } from "components/toast";
import { DELIVERABLE_SLOTS_CREATED_MESSAGE } from "util/messages";
import { DELIVERABLES_PAGE_QUERY } from "components/table/tables/DeliverableTable";
import { dueDateIsTodayOrFuture } from "./deliverableDueDateValidation";
import { getCurrentUser } from "components/user/UserContext";
import { useValidation, ValidationSchema } from "hooks/useValidation";

export const CREATE_DELIVERABLE_MUTATION = gql`
  mutation CreateDeliverable($input: CreateDeliverableInput!) {
    createDeliverable(input: $input) {
      id
    }
  }
`;

export const useCreateDeliverable = () => {
  const [createDeliverable, { loading }] = useMutation(CREATE_DELIVERABLE_MUTATION, {
    refetchQueries: [{ query: DELIVERABLES_PAGE_QUERY }],
    awaitRefetchQueries: true,
  });

  const createDeliverables = async (inputs: CreateDeliverableInput[]) => {
    await Promise.all(inputs.map((input) => createDeliverable({ variables: { input } })));
  };

  return { createDeliverables, loading };
};

export const ADD_DELIVERABLE_SLOT_DIALOG_TITLE = "Add New Deliverable Slot(s)";
export const ADD_DELIVERABLE_SLOT_DIALOG_NAME = "add-deliverable-slot-dialog";
export const ADD_DELIVERABLE_SLOT_SAVE_BUTTON_NAME = "button-add-deliverable-slot-confirm";

const ALL_QUARTERS = [1, 2, 3, 4] as const;
type Quarter = (typeof ALL_QUARTERS)[number];

// Demonstration types are required only for Implementation Plan or Monitoring Protocol; optional otherwise.
export const requiresDemonstrationTypes = (deliverableType: string): boolean =>
  (["Implementation Plan", "Monitoring Protocol"] as readonly string[]).includes(deliverableType);

export interface AddDeliverableSlotFormData {
  deliverableName: string;
  cmsOwnerUserId: string;
  deliverableType: DeliverableType;
  scheduleType: ScheduleType;
  dueDate: string;
  quarterlyDueDates: string[];
  demonstrationTypes: string[];
}

export type AddDeliverableSlotPayload = Omit<
  AddDeliverableSlotFormData,
  "quarterlyDueDates" | "scheduleType"
> & { demonstrationId: string };

export const getQuarterlyDeliverableSlotName = (
  demonstrationYear: number,
  quarter: Quarter,
  deliverableName: string
): string => `DY${demonstrationYear}Q${quarter} ${deliverableName}`;

export const buildAddDeliverableSlotPayloads = (
  demonstrationId: string,
  demonstrationYear: number,
  formData: AddDeliverableSlotFormData
): CreateDeliverableInput[] => {
  const { quarterlyDueDates, scheduleType, deliverableName, ...rest } = formData;
  const payloadBase = {
    ...rest,
    name: deliverableName,
    demonstrationId,
    dueDate: formData.dueDate as LocalDate,
  };

  if (scheduleType === "Single") {
    return [payloadBase];
  }

  return ALL_QUARTERS.map((quarter, quarterIndex) => ({
    ...payloadBase,
    name: getQuarterlyDeliverableSlotName(demonstrationYear, quarter, formData.deliverableName),
    dueDate: quarterlyDueDates[quarterIndex] as LocalDate,
  }));
};

const formHasChanges = (
  data: AddDeliverableSlotFormData,
  initialFormData: AddDeliverableSlotFormData
): boolean =>
  data.deliverableName !== initialFormData.deliverableName ||
  data.cmsOwnerUserId !== initialFormData.cmsOwnerUserId ||
  data.deliverableType !== initialFormData.deliverableType ||
  data.scheduleType !== initialFormData.scheduleType ||
  data.dueDate !== initialFormData.dueDate ||
  data.quarterlyDueDates.some((dueDate) => dueDate.length > 0) ||
  data.demonstrationTypes.length !== 0;

export type AddDeliverableSlotDemonstration = Pick<
  Demonstration,
  "effectiveDate" | "expirationDate" | "id"
> & {
  demonstrationTypes: Tag[];
};

const validation: ValidationSchema<AddDeliverableSlotFormData> = {
  deliverableName: [
    (formData) =>
      formData.deliverableName.trim().length > 0 ? undefined : "Deliverable name is required.",
  ],
  cmsOwnerUserId: [(formData) => (formData.cmsOwnerUserId ? undefined : "CMS Owner is required.")],
  deliverableType: [
    (formData) => (formData.deliverableType ? undefined : "Deliverable type is required."),
  ],
  scheduleType: [(formData) => (formData.scheduleType ? undefined : "Schedule type is required.")],
  dueDate: [
    (formData) =>
      formData.scheduleType === "Single" && !dueDateIsTodayOrFuture(formData.dueDate)
        ? "Due date must be today or in the future."
        : undefined,
  ],
  quarterlyDueDates: [
    (formData) =>
      formData.scheduleType === "Quarterly" &&
      !formData.quarterlyDueDates.every(dueDateIsTodayOrFuture)
        ? "All quarterly due dates must be today or in the future."
        : undefined,
  ],
  demonstrationTypes: [
    (formData) =>
      requiresDemonstrationTypes(formData.deliverableType) &&
      formData.demonstrationTypes.length === 0
        ? "At least one demonstration type is required."
        : undefined,
  ],
};

export const AddDeliverableSlotDialog = ({
  onClose,
  demonstration,
}: {
  onClose: () => void;
  demonstration: AddDeliverableSlotDemonstration;
}) => {
  const { showSuccess } = useToast();
  const { createDeliverables, loading } = useCreateDeliverable();

  const contextUser = getCurrentUser();
  if (!contextUser) {
    throw new Error("User context is not available.");
  }

  const initialFormData: AddDeliverableSlotFormData = {
    deliverableName: "",
    deliverableType: "" as DeliverableType,
    scheduleType: "Single",
    dueDate: "",
    quarterlyDueDates: ALL_QUARTERS.map(() => ""),
    demonstrationTypes: [],
    cmsOwnerUserId: contextUser.currentUser.id,
  };

  const [formData, setFormData] = useState<AddDeliverableSlotFormData>(initialFormData);
  const [demonstrationYear, setDemonstrationYear] = useState<number>(1);

  const { errors, isValid } = useValidation(formData, validation);

  const hasFormChanges = formHasChanges(formData, initialFormData);

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
          onClick={async () => {
            const payloads = buildAddDeliverableSlotPayloads(
              demonstration.id,
              demonstrationYear,
              formData
            );
            await createDeliverables(payloads);
            showSuccess(DELIVERABLE_SLOTS_CREATED_MESSAGE);
            onClose();
          }}
          disabled={!isValid || loading}
        >
          Save
        </Button>
      }
    >
      <div className="flex flex-col gap-sm">
        <div className="grid grid-cols-2 gap-sm">
          <DeliverableTypeField
            value={formData.deliverableType}
            onSelect={(deliverableType) =>
              setFormData((prev) => ({
                ...prev,
                deliverableType: deliverableType as DeliverableType,
              }))
            }
            validationMessage={errors.deliverableType}
          />
          <ScheduleTypeField
            value={formData.scheduleType}
            onSelect={(scheduleType) => setFormData((prev) => ({ ...prev, scheduleType }))}
            validationMessage={errors.scheduleType}
          />
        </div>
        {formData.scheduleType === "Quarterly" && (
          <QuarterlyDeliverableSchedule
            demonstrationEffectiveDate={demonstration.effectiveDate}
            demonstrationExpirationDate={demonstration.expirationDate}
            onSelectYear={(demonstrationYear) => setDemonstrationYear(demonstrationYear)}
            quarterlyDueDates={formData.quarterlyDueDates}
            onSelectQuarterDate={(quarterIndex, dueDate) =>
              setFormData((prev) => {
                const nextQuarterlyDueDates = [...prev.quarterlyDueDates];
                nextQuarterlyDueDates[quarterIndex] = dueDate;

                return {
                  ...prev,
                  quarterlyDueDates: nextQuarterlyDueDates,
                };
              })
            }
            validationMessage={errors.quarterlyDueDates}
          />
        )}
        {formData.scheduleType === "Single" && (
          <SingleDeliverableScheduleType
            value={formData.dueDate}
            onChange={(dueDate) => setFormData((prev) => ({ ...prev, dueDate }))}
            validationMessage={errors.dueDate}
          />
        )}
        <DeliverableNameField
          value={formData.deliverableName}
          onChange={(deliverableName) => setFormData((prev) => ({ ...prev, deliverableName }))}
          validationMessage={errors.deliverableName}
        />
        <div className="grid grid-cols-2 gap-sm">
          <CMSOwnerField
            value={formData.cmsOwnerUserId}
            onSelect={(cmsOwnerId) =>
              setFormData((prev) => ({ ...prev, cmsOwnerUserId: cmsOwnerId }))
            }
            validationMessage={errors.cmsOwnerUserId}
          />
          <DemonstrationTypeField
            demonstrationTypeTags={demonstration.demonstrationTypes}
            selectedValues={formData.demonstrationTypes}
            onSelect={(selectedTypes) =>
              setFormData((prev) => ({ ...prev, demonstrationTypes: selectedTypes }))
            }
            isRequired={requiresDemonstrationTypes(formData.deliverableType)}
            validationMessage={errors.demonstrationTypes}
          />
        </div>
      </div>
    </BaseDialog>
  );
};
