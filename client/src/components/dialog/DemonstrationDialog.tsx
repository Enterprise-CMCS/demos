import React, { useState } from "react";

import { Button, SecondaryButton } from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";
import { SelectCMCSDivision } from "components/input/select/SelectCMCSDivision";
import { SelectSignatureLevel } from "components/input/select/SelectSignatureLevel";
import { SelectUSAStates } from "components/input/select/SelectUSAStates";
import { TextInput } from "components/input/TextInput";
import { CreateDemonstrationInput, UpdateDemonstrationInput, Demonstration } from "demos-server";
import { useDateValidation } from "hooks/useDateValidation";
import { tw } from "tags/tw";
import { useMutation } from "@apollo/client";
import {
  CREATE_DEMONSTRATION_MUTATION,
  UPDATE_DEMONSTRATION_MUTATION,
} from "queries/demonstrationQueries";
import { useToast } from "components/toast";
import { SelectUsers } from "components/input/select/SelectUsers";

const LABEL_CLASSES = tw`text-text-font font-bold text-field-label flex gap-0-5`;
const DATE_INPUT_CLASSES = tw`w-full border rounded px-1 py-1 text-sm`;

type DemonstrationDialogMode = "create" | "edit";

type DemonstrationDialogFields = Pick<
  Demonstration,
  "name" | "description" | "cmcsDivision" | "signatureLevel"
> & { stateId: string; projectOfficerId: string; effectiveDate: string; expirationDate: string };

const DEFAULT_DEMONSTRATION_DIALOG_FIELDS: DemonstrationDialogFields = {
  name: "",
  effectiveDate: "",
  expirationDate: "",
  description: "",
  stateId: "",
  projectOfficerId: "",
};

const SUCCESS_MESSAGES: Record<DemonstrationDialogMode, string> = {
  create: "Demonstration created successfully!",
  edit: "Demonstration updated successfully!",
};

const ERROR_MESSAGES: Record<DemonstrationDialogMode, string> = {
  create: "Failed to create demonstration. Please try again.",
  edit: "Failed to update demonstration. Please try again.",
};

const DemonstrationDescriptionTextArea: React.FC<{
  description?: string;
  setDescription: (value: string) => void;
}> = ({ description, setDescription }) => {
  return (
    <>
      <label className={LABEL_CLASSES} htmlFor="description">
        Demonstration Description
      </label>
      <textarea
        data-testid="textarea-description"
        id="description"
        placeholder="Enter description"
        className="w-full border border-border-fields rounded px-1 py-1 text-sm resize-y min-h-[80px]"
        value={description}
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

const DemonstrationDialog: React.FC<{
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
      <form id="demonstration-form" className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-3 gap-5">
          <div>
            <SelectUSAStates
              label="State/Territory"
              currentState={activeDemonstration.stateId}
              value={activeDemonstration.stateId}
              isRequired
              onStateChange={(stateId) => setActiveDemonstration((prev) => ({ ...prev, stateId }))}
            />
          </div>
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
            <SelectUsers
              label="Project Officer"
              isRequired={true}
              initialUserId={activeDemonstration.projectOfficerId}
              onSelect={(userId) =>
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
          <SelectCMCSDivision
            onSelect={(cmcsDivision) =>
              setActiveDemonstration((prev) => ({ ...prev, cmcsDivision }))
            }
          />
          <SelectSignatureLevel
            onSelect={(signatureLevel) =>
              setActiveDemonstration((prev) => ({ ...prev, signatureLevel }))
            }
          />
        </div>
      </form>
    </BaseDialog>
  );
};

export const CreateDemonstrationDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { showSuccess, showError } = useToast();

  const [createDemonstrationTrigger] = useMutation(CREATE_DEMONSTRATION_MUTATION);

  const getCreateDemonstrationInput = (
    demonstration: DemonstrationDialogFields
  ): CreateDemonstrationInput => ({
    name: demonstration.name,
    description: demonstration.description,
    stateId: demonstration.stateId,
    projectOfficerUserId: demonstration.projectOfficerId,
    cmcsDivision: demonstration.cmcsDivision,
    signatureLevel: demonstration.signatureLevel,
  });

  const onSubmit = async (demonstration: DemonstrationDialogFields) => {
    try {
      const result = await createDemonstrationTrigger({
        variables: {
          input: getCreateDemonstrationInput(demonstration),
        },
      });

      const success = result.data?.createDemonstration?.success || false;
      onClose();
      if (success) {
        showSuccess(SUCCESS_MESSAGES.create);
      } else {
        showError(result.data?.createDemonstration?.message || ERROR_MESSAGES.create);
      }
    } catch {
      showError(ERROR_MESSAGES.create);
    }
  };

  return (
    <DemonstrationDialog
      isOpen={isOpen}
      onClose={onClose}
      mode="create"
      initialDemonstration={DEFAULT_DEMONSTRATION_DIALOG_FIELDS}
      onSubmit={onSubmit}
    />
  );
};
export const EditDemonstrationDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  demonstrationId: string;
}> = ({ isOpen, demonstrationId, onClose }) => {
  const { showSuccess, showError } = useToast();

  const [updateDemonstrationTrigger] = useMutation(UPDATE_DEMONSTRATION_MUTATION);
  // TODO: we should fetch the demonstration here using the ID

  const getUpdateDemonstrationInput = (
    demonstration: DemonstrationDialogFields
  ): UpdateDemonstrationInput => ({
    name: demonstration.name,
    description: demonstration.description,
    stateId: demonstration.stateId,
    cmcsDivision: demonstration.cmcsDivision,
    signatureLevel: demonstration.signatureLevel,
    // effectiveDate: demonstration.effectiveDate,
    // expirationDate: demonstration.expirationDate,
  });

  const onSubmit = async (demonstration: DemonstrationDialogFields) => {
    try {
      await updateDemonstrationTrigger({
        variables: {
          id: demonstrationId,
          input: getUpdateDemonstrationInput(demonstration),
        },
      });
      onClose();
      showSuccess(SUCCESS_MESSAGES.edit);
    } catch {
      showError(ERROR_MESSAGES.edit);
    }
  };

  return (
    <DemonstrationDialog
      isOpen={isOpen}
      onClose={onClose}
      mode="edit"
      onSubmit={onSubmit}
      initialDemonstration={DEFAULT_DEMONSTRATION_DIALOG_FIELDS}
    />
  );
};
