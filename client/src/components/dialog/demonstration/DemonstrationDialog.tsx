import React, { useState } from "react";

import { Button, SecondaryButton } from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";
import { Textarea } from "components/input";
import { SelectSdgDivision } from "components/input/select/SelectSdgDivision";
import { SelectSignatureLevel } from "components/input/select/SelectSignatureLevel";
import { SelectUSAStates } from "components/input/select/SelectUSAStates";
import { SelectUsers } from "components/input/select/SelectUsers";
import { TextInput } from "components/input/TextInput";
import { LocalDate, SdgDivision, SignatureLevel } from "demos-server";
import { tw } from "tags/tw";
import { useDialog } from "../DialogContext";

const LABEL_CLASSES = tw`text-text-font font-semibold text-field-label flex gap-0-5`;
const DATE_INPUT_CLASSES = tw`w-full border rounded px-1 py-half text-sm`;

export type DemonstrationData = {
  name?: string;
  stateId?: string;
  projectOfficerId?: string;
  description?: string;
  sdgDivision?: SdgDivision;
  signatureLevel?: SignatureLevel;
  effectiveDate?: LocalDate;
  expirationDate?: LocalDate;
};

type ValidationErrors = Partial<Record<keyof DemonstrationData, string>>;

const validateForm = (formData: DemonstrationData): ValidationErrors => {
  const errors: Record<string, string> = {};

  if (!formData.stateId) errors.stateId = "State/Territory is required";
  if (!formData.name?.trim()) errors.name = "Demonstration Title is required";
  if (!formData.projectOfficerId) errors.projectOfficerId = "Project Officer is required";

  if (formData.expirationDate && formData.effectiveDate) {
    const validExpirationDate = /^\d{4}-\d{2}-\d{2}$/.test(formData.expirationDate);
    const validEffectiveDate = /^\d{4}-\d{2}-\d{2}$/.test(formData.effectiveDate);
    if (!validExpirationDate) errors.expirationDate = "Expiration Date must be a valid date";
    if (!validEffectiveDate) errors.effectiveDate = "Effective Date must be a valid date";
    if (
      validEffectiveDate &&
      validExpirationDate &&
      new Date(formData.expirationDate) < new Date(formData.effectiveDate)
    )
      errors.expirationDate = "Expiration Date connot be before Effective Date.";
  }

  return errors;
};
type DemonstrationDialogProps =
  | {
      mode: "create";
      onSubmit: (demonstration: DemonstrationData) => Promise<void>;
    }
  | {
      mode: "edit";
      initialDemonstrationData: DemonstrationData;
      onSubmit: (demonstration: DemonstrationData) => Promise<void>;
    };
export const DemonstrationDialog: React.FC<DemonstrationDialogProps> = (props) => {
  const mode = props.mode;
  const onSubmit = props.onSubmit;
  const initialDemonstrationData = props.mode === "edit" ? props.initialDemonstrationData : {};

  const [demonstrationData, setDemonstrationData] =
    useState<DemonstrationData>(initialDemonstrationData);

  const { hideDialog } = useDialog();

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [hasChanged, setHasChanged] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const handleSubmit = async (formEvent: React.FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();

    const validationErrors = validateForm(demonstrationData);
    setValidationErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      setIsSubmitting(true);
      await onSubmit(demonstrationData);
      setIsSubmitting(false);
      hideDialog();
    }
  };

  const hasFormChanged = (initial: DemonstrationData, current: DemonstrationData): boolean => {
    return (
      initial.name !== current.name ||
      initial.stateId !== current.stateId ||
      initial.projectOfficerId !== current.projectOfficerId ||
      initial.description !== current.description ||
      initial.sdgDivision !== current.sdgDivision ||
      initial.signatureLevel !== current.signatureLevel ||
      initial.effectiveDate !== current.effectiveDate ||
      initial.expirationDate !== current.expirationDate
    );
  };

  const updateForm = (formData: DemonstrationData) => {
    setHasChanged(hasFormChanged(initialDemonstrationData, formData));
    setDemonstrationData(formData);
  };

  return (
    <BaseDialog
      title={mode === "edit" ? "Edit Demonstration" : "New Demonstration"}
      onClose={hideDialog}
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
          <Button
            name="button-submit-demonstration-dialog"
            size="small"
            disabled={!hasChanged}
            type="submit"
            form="demonstration-form"
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
        </>
      }
    >
      <form
        id="demonstration-form"
        className="flex flex-col gap-[24px]"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="grid grid-cols-3 gap-[24px]">
          <div className="col-span-1">
            <SelectUSAStates
              label="State/Territory"
              value={demonstrationData.stateId}
              isRequired
              onSelect={(stateId) => updateForm({ ...demonstrationData, stateId })}
            />
            {validationErrors.stateId && (
              <div className="text-text-warn text-sm mt-1">{validationErrors.stateId}</div>
            )}
          </div>
          <div className="col-span-2">
            <TextInput
              name="input-demonstration-title"
              label="Demonstration Title"
              isRequired
              placeholder="Enter title"
              value={demonstrationData.name}
              onChange={(e) => updateForm({ ...demonstrationData, name: e.target.value })}
            />
            {validationErrors.name && (
              <div className="text-text-warn text-sm mt-1">{validationErrors.name}</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-2">
            <SelectUsers
              label="Project Officer"
              isRequired={true}
              value={demonstrationData.projectOfficerId}
              onSelect={(userId) => updateForm({ ...demonstrationData, projectOfficerId: userId })}
              personTypes={["demos-admin", "demos-cms-user"]}
            />
            {validationErrors.projectOfficerId && (
              <div className="text-text-warn text-sm mt-1">{validationErrors.projectOfficerId}</div>
            )}
          </div>
          {mode === "edit" && (
            <>
              <div className="flex flex-col gap-xs">
                <label className={LABEL_CLASSES} htmlFor="effective-date">
                  Effective Date
                </label>
                <input
                  data-testid="input-effective-date"
                  id="effective-date"
                  type="date"
                  className={`${DATE_INPUT_CLASSES} ${
                    validationErrors.effectiveDate
                      ? "border-border-warn focus:ring-border-warn"
                      : "border-border-fields focus:ring-border-focus"
                  }`}
                  value={demonstrationData.effectiveDate}
                  onChange={(e) =>
                    updateForm({ ...demonstrationData, effectiveDate: e.target.value as LocalDate })
                  }
                />
                {validationErrors.effectiveDate && (
                  <div className="text-text-warn text-sm mt-1">
                    {validationErrors.effectiveDate}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-xs">
                <label className={LABEL_CLASSES} htmlFor="expiration-date">
                  Expiration Date
                </label>
                <input
                  data-testid="input-expiration-date"
                  id="expiration-date"
                  type="date"
                  className={`${DATE_INPUT_CLASSES} ${
                    validationErrors.expirationDate
                      ? "border-border-warn focus:ring-border-warn"
                      : "border-border-fields focus:ring-border-focus"
                  }`}
                  value={demonstrationData.expirationDate}
                  min={demonstrationData.effectiveDate || undefined}
                  onChange={(e) =>
                    updateForm({
                      ...demonstrationData,
                      expirationDate: e.target.value as LocalDate,
                    })
                  }
                />
                {validationErrors.expirationDate && (
                  <div className="text-text-warn text-sm mt-1">
                    {validationErrors.expirationDate}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col gap-xs">
          <Textarea
            name="description"
            label="Demonstration Description"
            placeholder="Enter description"
            initialValue={demonstrationData.description ?? ""}
            onChange={(e) => updateForm({ ...demonstrationData, description: e.target.value })}
          />
          {validationErrors.description && (
            <div className="text-text-warn text-sm mt-1">{validationErrors.description}</div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <SelectSdgDivision
            initialValue={demonstrationData.sdgDivision}
            onSelect={(sdgDivision) => updateForm({ ...demonstrationData, sdgDivision })}
          />
          <SelectSignatureLevel
            initialValue={demonstrationData.signatureLevel}
            onSelect={(signatureLevel) => updateForm({ ...demonstrationData, signatureLevel })}
          />
        </div>
      </form>
    </BaseDialog>
  );
};
