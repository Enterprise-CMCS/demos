import React, { useState } from "react";

import { BaseDialog } from "components/dialog/BaseDialog";
import { Textarea } from "components/input";
import { SelectSdgDivision } from "components/input/select/SelectSdgDivision";
import { SelectSignatureLevel } from "components/input/select/SelectSignatureLevel";
import { SelectUSAStates } from "components/input/select/SelectUSAStates";
import { SelectUsers } from "components/input/select/SelectUsers";
import { TextInput } from "components/input/TextInput";
import { Demonstration, SignatureLevel } from "demos-server";
import { DatePicker } from "components/input/date/DatePicker";
import { EXPIRATION_DATE_ERROR_MESSAGE, getRequiredFieldWhenApprovedMessage } from "util/messages";
import { isBefore } from "date-fns";
import { Input } from "components/input/Input";
import { STATES_AND_TERRITORIES } from "demos-server-constants";
import { Button } from "components/button";
import { Spinner } from "components/loading/Spinner";

export const DEMONSTRATION_DIALOG_DESCRIPTION_NAME = "textarea-demonstration-description";
export const SUBMIT_BUTTON_NAME = "button-submit-demonstration-dialog";
export const DEFAULT_DEMONSTRATION_SIGNATURE_LEVEL = "OA" as SignatureLevel;

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
      value={description ?? ""}
      onChange={setDescription}
    />
  );
};

const SubmitButton = ({
  onClick,
  disabled,
  isSubmitting,
}: {
  onClick: () => void;
  disabled?: boolean;
  isSubmitting: boolean;
}) => {
  return (
    <Button
      name={SUBMIT_BUTTON_NAME}
      onClick={onClick}
      aria-label={"Create New Demonstration"}
      disabled={disabled || isSubmitting}
    >
      {isSubmitting && <Spinner />}
      {isSubmitting ? "Loading" : "Submit"}
    </Button>
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

export const checkFormIsValid = (demonstration: DemonstrationDialogFields, isApproved: boolean) => {
  if (!demonstration.name) {
    return false;
  }
  if (!demonstration.stateId) {
    return false;
  }
  if (!demonstration.projectOfficerId) {
    return false;
  }
  if (
    isApproved &&
    (!demonstration.effectiveDate || !demonstration.expirationDate || !demonstration.sdgDivision)
  ) {
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

export const DemonstrationDialog: React.FC<{
  onClose: () => void;
  mode: DemonstrationDialogMode;
  isApproved?: boolean;
  initialDemonstration: DemonstrationDialogFields;
  onSubmit: (demonstration: DemonstrationDialogFields) => Promise<void>;
}> = ({ onClose, mode, isApproved = false, initialDemonstration, onSubmit }) => {
  const [activeDemonstration, setActiveDemonstration] = useState(initialDemonstration);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await onSubmit(activeDemonstration);
    setIsSubmitting(false);
  };

  const formHasChanges = checkFormHasChanges(initialDemonstration, activeDemonstration);

  return (
    <BaseDialog
      title={mode === "edit" ? "Edit Demonstration" : "New Demonstration"}
      onClose={onClose}
      maxWidthClass="max-w-[920px]"
      dialogHasChanges={formHasChanges}
      actionButton={
        <SubmitButton
          disabled={!formHasChanges || !checkFormIsValid(activeDemonstration, isApproved)}
          isSubmitting={isSubmitting}
          onClick={handleSubmit}
        />
      }
    >
      <form id="demonstration-form" className="flex flex-col gap-[24px]">
        <div className="grid grid-cols-3 gap-[24px]">
          {mode === "create" ? (
            <SelectUSAStates
              label="State/Territory"
              value={activeDemonstration.stateId}
              isRequired
              onSelect={(stateId) => setActiveDemonstration({ ...activeDemonstration, stateId })}
            />
          ) : (
            <Input
              type="text"
              name="state-display"
              label="State/Territory"
              value={
                STATES_AND_TERRITORIES.find((state) => state.id === activeDemonstration.stateId)
                  ?.name
              }
              isDisabled
            />
          )}
          <div className="col-span-2">
            <TextInput
              name="input-demonstration-title"
              label="Demonstration Title"
              isRequired
              placeholder="Enter title"
              value={activeDemonstration.name}
              onChange={(e) =>
                setActiveDemonstration({ ...activeDemonstration, name: e.target.value })
              }
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
                setActiveDemonstration({ ...activeDemonstration, projectOfficerId })
              }
              personTypes={["demos-admin", "demos-cms-user"]}
            />
          </div>
          {mode === "edit" && (
            <DateInputs
              isApproved={isApproved}
              effectiveDate={activeDemonstration.effectiveDate}
              expirationDate={activeDemonstration.expirationDate}
              setEffectiveDate={(effectiveDate) =>
                setActiveDemonstration({ ...activeDemonstration, effectiveDate })
              }
              setExpirationDate={(expirationDate) =>
                setActiveDemonstration({ ...activeDemonstration, expirationDate })
              }
            />
          )}
        </div>

        <div className="flex flex-col gap-xs">
          <DemonstrationDescriptionTextArea
            description={activeDemonstration.description}
            setDescription={(description) =>
              setActiveDemonstration({ ...activeDemonstration, description })
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-xs">
            <SelectSdgDivision
              isRequired={isApproved}
              initialValue={activeDemonstration.sdgDivision}
              onSelect={(sdgDivision) =>
                setActiveDemonstration({ ...activeDemonstration, sdgDivision })
              }
            />
            {isApproved && !activeDemonstration.sdgDivision && (
              <span className="text-text-warn text-sm">
                {getRequiredFieldWhenApprovedMessage("SDG Division")}
              </span>
            )}
          </div>
          <SelectSignatureLevel
            initialValue={DEFAULT_DEMONSTRATION_SIGNATURE_LEVEL}
            allowedSignatureLevels={["OA"]}
            isDisabled
            onSelect={(signatureLevel) =>
              setActiveDemonstration({ ...activeDemonstration, signatureLevel })
            }
          />
        </div>
      </form>
    </BaseDialog>
  );
};
