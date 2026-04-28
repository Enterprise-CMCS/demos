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
import { CreateDeliverableInput, DeliverableType, Demonstration, LocalDate, Tag } from "demos-server";
import { useToast } from "components/toast";
import { DELIVERABLE_SLOTS_CREATED_MESSAGE } from "util/messages";
import { DELIVERABLES_PAGE_QUERY } from "components/table/tables/DeliverableTable";
import { getTodayEst } from "util/formatDate";
import { isBefore } from "date-fns";

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
    await Promise.all(
      inputs.map((input) => createDeliverable({ variables: { input } }))
    );
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

const INITIAL_FORM_DATA: AddDeliverableSlotFormData = {
  deliverableName: "",
  cmsOwnerUserId: "",
  deliverableType: "" as DeliverableType,
  scheduleType: "Single",
  dueDate: "",
  quarterlyDueDates: ALL_QUARTERS.map(() => ""),
  demonstrationTypes: [],
};

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
  const payloadBase = { ...rest, name: deliverableName, demonstrationId, dueDate: formData.dueDate as LocalDate };

  if (scheduleType === "Single") {
    return [payloadBase];
  }

  return ALL_QUARTERS.map((quarter, quarterIndex) => ({
    ...payloadBase,
    name: getQuarterlyDeliverableSlotName(
      demonstrationYear,
      quarter,
      formData.deliverableName
    ),
    dueDate: quarterlyDueDates[quarterIndex] as LocalDate,
  }));
};

const isOnOrAfterToday = (date: string, today: string): boolean =>
  date.length > 0 && !isBefore(date, today);

const hasValidDueDateForScheduleType = (data: AddDeliverableSlotFormData, today: string): boolean =>
  data.scheduleType === "Single"
    ? isOnOrAfterToday(data.dueDate, today)
    : data.quarterlyDueDates.every((dueDate) => isOnOrAfterToday(dueDate, today));

const formIsValid = (data: AddDeliverableSlotFormData, today: string): boolean =>
  data.deliverableName.trim().length > 0 &&
  data.cmsOwnerUserId.length > 0 &&
  data.deliverableType.length > 0 &&
  data.scheduleType.length > 0 &&
  hasValidDueDateForScheduleType(data, today) &&
  (!requiresDemonstrationTypes(data.deliverableType) || data.demonstrationTypes.length > 0);

const formHasChanges = (data: AddDeliverableSlotFormData): boolean =>
  data.deliverableName !== INITIAL_FORM_DATA.deliverableName ||
  data.cmsOwnerUserId !== INITIAL_FORM_DATA.cmsOwnerUserId ||
  data.deliverableType !== INITIAL_FORM_DATA.deliverableType ||
  data.scheduleType !== INITIAL_FORM_DATA.scheduleType ||
  data.dueDate !== INITIAL_FORM_DATA.dueDate ||
  data.quarterlyDueDates.some((dueDate) => dueDate.length > 0) ||
  data.demonstrationTypes.length !== 0;

export type AddDeliverableSlotDemonstration = Pick<
  Demonstration,
  "effectiveDate" | "expirationDate" | "id"
> & {
  demonstrationTypes: Tag[];
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

  const [formData, setFormData] = useState<AddDeliverableSlotFormData>(INITIAL_FORM_DATA);
  const [demonstrationYear, setDemonstrationYear] = useState<number>(1);

  const today = getTodayEst();
  const isFormValid = formIsValid(formData, today);
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
          disabled={!isFormValid || loading}
        >
          Save
        </Button>
      }
    >
      <div className="flex flex-col gap-sm">
        <div className="grid grid-cols-2 gap-sm">
          <DeliverableTypeField
            value={formData.deliverableType}
            onSelect={(deliverableType) => setFormData((prev) => ({ ...prev, deliverableType: deliverableType as DeliverableType }))}
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
          />
        )}
        {formData.scheduleType === "Single" && (
          <SingleDeliverableScheduleType
            value={formData.dueDate}
            onChange={(dueDate) => setFormData((prev) => ({ ...prev, dueDate }))}
          />
        )}
        <DeliverableNameField
          value={formData.deliverableName}
          onChange={(deliverableName) => setFormData((prev) => ({ ...prev, deliverableName }))}
        />
        <div className="grid grid-cols-2 gap-sm">
          <CMSOwnerField
            value={formData.cmsOwnerUserId}
            onSelect={(cmsOwnerId) => setFormData((prev) => ({ ...prev, cmsOwnerUserId: cmsOwnerId }))}
          />
          <DemonstrationTypeField
            demonstrationTypeTags={demonstration.demonstrationTypes}
            selectedValues={formData.demonstrationTypes}
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
