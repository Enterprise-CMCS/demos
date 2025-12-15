import React, { useEffect, useState } from "react";

import { Button, SecondaryButton } from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";
import { Textarea } from "components/input";
import { SelectSdgDivision } from "components/input/select/SelectSdgDivision";
import { SelectSignatureLevel } from "components/input/select/SelectSignatureLevel";
import { SelectUSAStates } from "components/input/select/SelectUSAStates";
import { SelectUsers } from "components/input/select/SelectUsers";
import { TextInput } from "components/input/TextInput";
import { Demonstration } from "demos-server";
import { DatePicker } from "components/input/date/DatePicker";
import { EXPIRATION_DATE_ERROR_MESSAGE } from "util/messages";

export type DemonstrationDialogMode = "create" | "edit";

export type DemonstrationDialogFields = Pick<
  Demonstration,
  "name" | "description" | "sdgDivision" | "signatureLevel"
> & { stateId: string; projectOfficerId: string; effectiveDate: string; expirationDate: string };

const DemonstrationDescriptionTextArea: React.FC<{
  description?: string;
  setDescription: (value: string) => void;
}> = ({ description, setDescription }) => {
  return (
    <>
      <Textarea
        name="description"
        label="Demonstration Description"
        placeholder="Enter description"
        initialValue={description ?? ""}
        onChange={(e) => setDescription(e.target.value)}
      />
    </>
  );
};

const SubmitButton: React.FC<{
  isChanged: boolean;
  isSubmitting: boolean;
}> = ({ isChanged, isSubmitting }) => {
  return (
    <Button
      name="button-submit-demonstration-dialog"
      size="small"
      disabled={!isChanged || isSubmitting}
      type="submit"
      form="demonstration-form"
      onClick={() => {}}
    >
      {isSubmitting ? (
        <svg
          className="animate-spin h-2 w-2 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : (
        "Submit"
      )}
    </Button>
  );
};

const DateInputs: React.FC<{
  effectiveDate: string;
  expirationDate: string;
  setEffectiveDate: (date: string) => void;
  setExpirationDate: (date: string) => void;
}> = ({ effectiveDate, expirationDate, setEffectiveDate, setExpirationDate }) => {
  // Validate expiration date is after effective date
  useEffect(() => {}, [effectiveDate, expirationDate]);

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
          getValidationMessage={() => EXPIRATION_DATE_ERROR_MESSAGE}
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
    updatedDemonstration.signatureLevel !== initialDemonstration.signatureLevel
  );
};

export const DemonstrationDialog: React.FC<{
  onClose: () => void;
  mode: DemonstrationDialogMode;
  initialDemonstration: DemonstrationDialogFields;
  onSubmit: (demonstration: DemonstrationDialogFields) => Promise<void>;
}> = ({ onClose, mode, initialDemonstration, onSubmit }) => {
  const [activeDemonstration, setActiveDemonstration] = useState(initialDemonstration);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formHasChanges, setFormHasChanges] = useState<boolean>(false);

  const handleSubmit = async (formEvent: React.FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();
    setIsSubmitting(true);
    await onSubmit(activeDemonstration);
    setIsSubmitting(false);
  };

  const handleChange = (updatedDemonstration: DemonstrationDialogFields) => {
    setActiveDemonstration(updatedDemonstration);
    setFormHasChanges(checkFormHasChanges(initialDemonstration, updatedDemonstration));
  };

  return (
    <BaseDialog
      title={mode === "edit" ? "Edit Demonstration" : "New Demonstration"}
      onClose={onClose}
      showCancelConfirm={showCancelConfirm}
      setShowCancelConfirm={setShowCancelConfirm}
      maxWidthClass="max-w-[920px]"
      actions={
        <>
          <SecondaryButton
            name="button-cancel-demonstration-dialog"
            size="small"
            onClick={() => setShowCancelConfirm(true)}
          >
            Cancel
          </SecondaryButton>
          <SubmitButton isChanged={formHasChanges} isSubmitting={isSubmitting} />
        </>
      }
    >
      <form id="demonstration-form" className="flex flex-col gap-[24px]" onSubmit={handleSubmit}>
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
      </form>
    </BaseDialog>
  );
};
