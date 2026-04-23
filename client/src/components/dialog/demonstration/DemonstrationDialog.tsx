import React, { useEffect, useState } from "react";

import { BaseDialog } from "components/dialog/BaseDialog";
import { Textarea } from "components/input";
import { Checkbox } from "components/input/Checkbox";
import { SelectSdgDivision } from "components/input/select/SelectSdgDivision";
import { SelectSignatureLevel } from "components/input/select/SelectSignatureLevel";
import { SelectUSAStates } from "components/input/select/SelectUSAStates";
import { SelectUsers } from "components/input/select/SelectUsers";
import { TextInput } from "components/input/TextInput";
import { Demonstration } from "demos-server";
import { DatePicker } from "components/input/date/DatePicker";
import { EXPIRATION_DATE_ERROR_MESSAGE } from "util/messages";
import { SubmitButton } from "components/button/SubmitButton";
import { HintIcon } from "components/icons/Input/HintIcon";
import { isBefore } from "date-fns";

export const DEMONSTRATION_DIALOG_DESCRIPTION_NAME = "textarea-demonstration-description";

export type DemonstrationDialogMode = "create" | "edit";

export const DEMO_ID_MEDICAID = "medicaid";
export const DEMO_ID_CHIP = "chip";

export const DEMO_ID_OPTIONS = [
  { label: "Medicaid Demonstration", value: DEMO_ID_MEDICAID },
  { label: "Children's Health Insurance Program (CHIP)", value: DEMO_ID_CHIP },
];

export type DemonstrationDialogFields = Pick<
  Demonstration,
  "name" | "description" | "sdgDivision" | "signatureLevel"
> & {
  stateId: string;
  projectOfficerId: string;
  effectiveDate: string;
  expirationDate: string;
  demoIds: string[];
};

const DemonstrationDescriptionTextArea: React.FC<{
  description?: string;
  setDescription: (value: string) => void;
}> = ({ description, setDescription }) => {
  return (
    <Textarea
      name={DEMONSTRATION_DIALOG_DESCRIPTION_NAME}
      label="Demonstration Description"
      placeholder="Enter description"
      initialValue={description ?? ""}
      onChange={(e) => setDescription(e.target.value)}
    />
  );
};

const DateInputs: React.FC<{
  effectiveDate: string;
  expirationDate: string;
  setEffectiveDate: (date: string) => void;
  setExpirationDate: (date: string) => void;
}> = ({ effectiveDate, expirationDate, setEffectiveDate, setExpirationDate }) => {
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Validate expiration date is after effective date
  useEffect(() => {
    if (expirationDate && effectiveDate && isBefore(expirationDate, effectiveDate)) {
      setErrorMessage(EXPIRATION_DATE_ERROR_MESSAGE);
    } else {
      setErrorMessage("");
    }
  }, [effectiveDate, expirationDate]);

  return (
    <>
      <div className="flex flex-col gap-xs">
        <DatePicker
          name="datepicker-effective-date"
          label="Effective Date"
          value={effectiveDate}
          onChange={(newDate) => setEffectiveDate(newDate)}
        />
      </div>
      <div className="flex flex-col gap-xs">
        <DatePicker
          name="datepicker-expiration-date"
          label="Expiration Date"
          value={expirationDate}
          onChange={(newDate) => setExpirationDate(newDate)}
          getValidationMessage={() => errorMessage}
        />
      </div>
    </>
  );
};

export const checkFormHasChanges = (
  initialDemonstration: DemonstrationDialogFields,
  updatedDemonstration: DemonstrationDialogFields
) => {
  return (
    updatedDemonstration.name !== initialDemonstration.name ||
    updatedDemonstration.description !== initialDemonstration.description ||
    updatedDemonstration.stateId !== initialDemonstration.stateId ||
    updatedDemonstration.projectOfficerId !== initialDemonstration.projectOfficerId ||
    updatedDemonstration.effectiveDate !== initialDemonstration.effectiveDate ||
    updatedDemonstration.expirationDate !== initialDemonstration.expirationDate ||
    updatedDemonstration.sdgDivision !== initialDemonstration.sdgDivision ||
    updatedDemonstration.signatureLevel !== initialDemonstration.signatureLevel ||
    [...updatedDemonstration.demoIds].sort((a, b) => a.localeCompare(b)).join(",") !==
      [...initialDemonstration.demoIds].sort((a, b) => a.localeCompare(b)).join(",")
  );
};

export const checkFormIsValid = (demonstration: DemonstrationDialogFields) => {
  if (!demonstration.name) {
    return false;
  }
  if (!demonstration.stateId) {
    return false;
  }
  if (!demonstration.projectOfficerId) {
    return false;
  }
  if (demonstration.demoIds.length === 0) {
    return false;
  }
  if (
    demonstration.expirationDate &&
    demonstration.effectiveDate &&
    isBefore(demonstration.expirationDate, demonstration.effectiveDate)
  ) {
    return false;
  }
  return true;
};

const DemoIdCheckboxes: React.FC<{
  values: string[];
  onChange: (values: string[]) => void;
}> = ({ values, onChange }) => {
  const toggle = (value: string) => {
    if (values.includes(value)) {
      onChange(values.filter((v) => v !== value));
    } else {
      onChange([...values, value]);
    }
  };

  return (
    <div className="flex flex-col gap-xs">
      <div className="text-text-font font-semibold text-field-label flex items-center gap-0-5">
        <span className="text-text-warn">*</span>
        <span>DEMO ID</span>
        <span
          className="cursor-help text-text-placeholder"
          title="Select Medicaid Demonstration, CHIP, or both. Selecting CHIP will generate a unique CHIP ID."
        >
          <HintIcon />
        </span>
      </div>
      <div className="flex gap-8 items-center flex-nowrap whitespace-nowrap">
        {DEMO_ID_OPTIONS.map((option) => (
          <Checkbox
            key={option.value}
            name={`checkbox-demo-id-${option.value}`}
            label={option.label}
            checked={values.includes(option.value)}
            onChange={() => toggle(option.value)}
          />
        ))}
      </div>
    </div>
  );
};

export const DemonstrationDialog: React.FC<{
  onClose: () => void;
  mode: DemonstrationDialogMode;
  initialDemonstration: DemonstrationDialogFields;
  onSubmit: (demonstration: DemonstrationDialogFields) => Promise<void>;
}> = ({ onClose, mode, initialDemonstration, onSubmit }) => {
  const [activeDemonstration, setActiveDemonstration] = useState(initialDemonstration);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formHasChanges, setFormHasChanges] = useState<boolean>(false);
  const [formIsValid, setFormIsValid] = useState<boolean>(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await onSubmit(activeDemonstration);
    setIsSubmitting(false);
  };

  const handleChange = (updatedDemonstration: DemonstrationDialogFields) => {
    setActiveDemonstration(updatedDemonstration);
    setFormHasChanges(checkFormHasChanges(initialDemonstration, updatedDemonstration));
    setFormIsValid(checkFormIsValid(updatedDemonstration));
  };

  return (
    <BaseDialog
      title={mode === "edit" ? "Edit Demonstration" : "New Demonstration"}
      onClose={onClose}
      maxWidthClass="max-w-[920px]"
      dialogHasChanges={formHasChanges}
      actionButton={
        <SubmitButton
          name={"button-submit-demonstration-dialog"}
          disabled={!formHasChanges || !formIsValid}
          isSubmitting={isSubmitting}
          onClick={handleSubmit}
        />
      }
    >
      <form id="demonstration-form" className="flex flex-col gap-[24px]">
        <div className="grid grid-cols-3 gap-[24px]">
          <SelectUSAStates
            label="State/Territory"
            value={activeDemonstration.stateId}
            isRequired
            onSelect={(stateId) => handleChange({ ...activeDemonstration, stateId })}
          />
          <div className="col-span-2">
            <TextInput
              name="input-demonstration-title"
              label="Demonstration Title"
              isRequired
              placeholder="Enter title"
              value={activeDemonstration.name}
              onChange={(e) => handleChange({ ...activeDemonstration, name: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-2">
            <SelectUsers
              label="Project Officer"
              isRequired={true}
              value={activeDemonstration.projectOfficerId}
              onSelect={(projectOfficerId) =>
                handleChange({ ...activeDemonstration, projectOfficerId })
              }
              personTypes={["demos-admin", "demos-cms-user"]}
            />
          </div>
          {mode === "edit" && (
            <DateInputs
              effectiveDate={activeDemonstration.effectiveDate}
              expirationDate={activeDemonstration.expirationDate}
              setEffectiveDate={(effectiveDate) =>
                handleChange({ ...activeDemonstration, effectiveDate })
              }
              setExpirationDate={(expirationDate) =>
                handleChange({ ...activeDemonstration, expirationDate })
              }
            />
          )}
        </div>

        <div className="flex flex-col gap-xs">
          <DemonstrationDescriptionTextArea
            description={activeDemonstration.description}
            setDescription={(description) => handleChange({ ...activeDemonstration, description })}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <SelectSdgDivision
            initialValue={activeDemonstration.sdgDivision}
            onSelect={(sdgDivision) => handleChange({ ...activeDemonstration, sdgDivision })}
          />
          <SelectSignatureLevel
            initialValue={activeDemonstration.signatureLevel}
            onSelect={(signatureLevel) => handleChange({ ...activeDemonstration, signatureLevel })}
          />
        </div>

        <DemoIdCheckboxes
          values={activeDemonstration.demoIds}
          onChange={(demoIds: string[]) =>
            handleChange({ ...activeDemonstration, demoIds })
          }
        />
      </form>
    </BaseDialog>
  );
};
