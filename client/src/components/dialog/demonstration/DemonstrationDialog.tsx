import React, { useState } from "react";

import { Button, SecondaryButton } from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";
import { Textarea } from "components/input";
import { SelectSdgDivision } from "components/input/select/SelectSdgDivision";
import { SelectSignatureLevel } from "components/input/select/SelectSignatureLevel";
import { SelectStates } from "components/input/select/SelectStates";
import { SelectPeople } from "components/input/select/SelectPeople";
import { TextInput } from "components/input/TextInput";
import { Demonstration } from "demos-server";
import { useDateValidation } from "hooks/useDateValidation";
import { tw } from "tags/tw";

const LABEL_CLASSES = tw`text-text-font font-bold text-field-label flex gap-0-5`;
const DATE_INPUT_CLASSES = tw`w-full border rounded px-1 py-1 text-sm`;

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
  activeDemonstration: DemonstrationDialogFields;
  isSubmitting: boolean;
}> = ({ activeDemonstration, isSubmitting }) => {
  return (
    <Button
      name="button-submit-demonstration-dialog"
      size="small"
      disabled={
        !(
          activeDemonstration.stateId &&
          activeDemonstration.name &&
          activeDemonstration.projectOfficerId
        ) || isSubmitting
      }
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
  const { expirationError, handleEffectiveDateChange, handleExpirationDateChange } =
    useDateValidation();

  return (
    <>
      <div className="flex flex-col gap-sm">
        <label className={LABEL_CLASSES} htmlFor="effective-date">
          Effective Date
        </label>
        <input
          data-testid="input-effective-date"
          id="effective-date"
          type="date"
          className={DATE_INPUT_CLASSES}
          value={effectiveDate}
          onChange={(e) =>
            handleEffectiveDateChange(
              e.target.value,
              expirationDate,
              (value) => setEffectiveDate(value),
              (value) => setExpirationDate(value)
            )
          }
        />
      </div>
      <div className="flex flex-col gap-sm">
        <label className={LABEL_CLASSES} htmlFor="expiration-date">
          Expiration Date
        </label>
        <input
          data-testid="input-expiration-date"
          id="expiration-date"
          type="date"
          className={`${DATE_INPUT_CLASSES} ${
            expirationError
              ? "border-border-warn focus:ring-border-warn"
              : "border-border-fields focus:ring-border-focus"
          }`}
          value={expirationDate}
          min={effectiveDate || undefined}
          onChange={(e) =>
            handleExpirationDateChange(e.target.value, effectiveDate, setExpirationDate)
          }
        />
        {expirationError && <div className="text-text-warn text-sm mt-1">{expirationError}</div>}
      </div>
    </>
  );
};

export const DemonstrationDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  mode: DemonstrationDialogMode;
  initialDemonstration: DemonstrationDialogFields;
  onSubmit: (demonstration: DemonstrationDialogFields) => Promise<void>;
}> = ({ isOpen, onClose, mode, initialDemonstration, onSubmit }) => {
  const [activeDemonstration, setActiveDemonstration] = useState(initialDemonstration);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (formEvent: React.FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();
    setIsSubmitting(true);
    await onSubmit(activeDemonstration);
    setIsSubmitting(false);
  };

  return (
    <BaseDialog
      title={mode === "edit" ? "Edit Demonstration" : "New Demonstration"}
      isOpen={isOpen}
      onClose={onClose}
      showCancelConfirm={showCancelConfirm}
      setShowCancelConfirm={setShowCancelConfirm}
      maxWidthClass="max-w-[720px]"
      actions={
        <>
          <SecondaryButton
            name="button-cancel-demonstration-dialog"
            size="small"
            onClick={() => setShowCancelConfirm(true)}
          >
            Cancel
          </SecondaryButton>
          <SubmitButton activeDemonstration={activeDemonstration} isSubmitting={isSubmitting} />
        </>
      }
    >
      <form id="demonstration-form" className="flex flex-col gap-[24px]" onSubmit={handleSubmit}>
        <div className="grid grid-cols-3 gap-[24px]">
          <SelectStates
            label="State/Territory"
            value={activeDemonstration.stateId}
            isRequired
            onChange={(stateId) => setActiveDemonstration((prev) => ({ ...prev, stateId }))}
          />
          <div className="col-span-2">
            <TextInput
              name="title"
              label="Demonstration Title"
              isRequired
              placeholder="Enter title"
              value={activeDemonstration.name}
              onChange={(e) =>
                setActiveDemonstration((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-2">
            <SelectPeople
              label="Project Officer"
              isRequired={true}
              value={activeDemonstration.projectOfficerId}
              onChange={(userId) =>
                setActiveDemonstration((prev) => ({ ...prev, projectOfficerId: userId }))
              }
              personTypes={["demos-admin", "demos-cms-user"]}
            />
          </div>
          {mode === "edit" && (
            <DateInputs
              effectiveDate={activeDemonstration.effectiveDate}
              expirationDate={activeDemonstration.expirationDate}
              setEffectiveDate={(value) =>
                setActiveDemonstration((prev) => ({ ...prev, effectiveDate: value }))
              }
              setExpirationDate={(value) =>
                setActiveDemonstration((prev) => ({ ...prev, expirationDate: value }))
              }
            />
          )}
        </div>

        <div className="flex flex-col gap-sm">
          <DemonstrationDescriptionTextArea
            description={activeDemonstration.description}
            setDescription={(value) =>
              setActiveDemonstration((prev) => ({ ...prev, description: value }))
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <SelectSdgDivision
            value={activeDemonstration.sdgDivision}
            onChange={(sdgDivision) => setActiveDemonstration((prev) => ({ ...prev, sdgDivision }))}
          />
          <SelectSignatureLevel
            value={activeDemonstration.signatureLevel}
            onChange={(signatureLevel) =>
              setActiveDemonstration((prev) => ({ ...prev, signatureLevel }))
            }
          />
        </div>
      </form>
    </BaseDialog>
  );
};
