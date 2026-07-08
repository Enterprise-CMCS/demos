import React from "react";
import { CreateDemonstrationInput, SdgDivision } from "demos-server";
import { getCurrentUser } from "components/user/UserContext";
import { useState } from "react";
import { BaseDialog } from "components/dialog/BaseDialog";
import { Textarea } from "components/input";
import { SelectSdgDivision } from "components/input/select/SelectSdgDivision";
import { SelectSignatureLevel } from "components/input/select/SelectSignatureLevel";
import { SelectUSAStates } from "components/input/select/SelectUSAStates";
import { SelectUsers } from "components/input/select/SelectUsers";
import { TextInput } from "components/input/TextInput";
import { SignatureLevel } from "demos-server";
import { Button } from "components/button";
import { Spinner } from "components/loading/Spinner";
import { useDialog } from "../DialogContext";
import { useCreateDemonstration } from "./useCreateDemonstration";

export const DEMONSTRATION_DIALOG_DESCRIPTION_NAME = "textarea-demonstration-description";
export const SUBMIT_BUTTON_NAME = "button-submit-demonstration-dialog";
export const DEFAULT_DEMONSTRATION_SIGNATURE_LEVEL = "OA" as SignatureLevel;

export type CreateDemonstrationFormData = {
  name: string;
  description: string;
  stateId: string;
  sdgDivision?: SdgDivision;
  projectOfficerUserId: string;
};

export const checkFormHasChanges = (
  initialDemonstration: CreateDemonstrationFormData,
  activeDemonstration: CreateDemonstrationFormData
) => {
  return !!(
    activeDemonstration.name ||
    activeDemonstration.description ||
    activeDemonstration.stateId ||
    activeDemonstration.sdgDivision ||
    activeDemonstration.projectOfficerUserId !== initialDemonstration.projectOfficerUserId
  );
};

export const checkFormIsValid = (demonstration: CreateDemonstrationFormData) => {
  return demonstration.name && demonstration.stateId && demonstration.projectOfficerUserId;
};

export const CreateDemonstrationDialog = () => {
  const userContext = getCurrentUser();
  const { closeDialog } = useDialog();
  const { onSubmit, saving } = useCreateDemonstration({ onSuccess: closeDialog });
  const initialDemonstration: CreateDemonstrationFormData = {
    name: "",
    description: "",
    stateId: "",
    sdgDivision: undefined,
    projectOfficerUserId: userContext.currentUser.id,
  };
  const [activeDemonstration, setActiveDemonstration] =
    useState<CreateDemonstrationFormData>(initialDemonstration);

  const hasChanges = checkFormHasChanges(initialDemonstration, activeDemonstration);
  const formIsValid = checkFormIsValid(activeDemonstration);

  return (
    <BaseDialog
      title={"New Demonstration"}
      onClose={closeDialog}
      maxWidthClass="max-w-[920px]"
      dialogHasChanges={hasChanges}
      actionButton={
        <Button
          name={SUBMIT_BUTTON_NAME}
          onClick={() => onSubmit(activeDemonstration satisfies CreateDemonstrationInput)}
          aria-label={"Create New Demonstration"}
          disabled={!hasChanges || !formIsValid || saving}
        >
          {saving && <Spinner />}
          {saving ? "Loading" : "Submit"}
        </Button>
      }
    >
      <CreateDemonstrationForm
        activeDemonstration={activeDemonstration}
        setActiveDemonstration={setActiveDemonstration}
      />
    </BaseDialog>
  );
};

const CreateDemonstrationForm = ({
  activeDemonstration,
  setActiveDemonstration,
}: {
  activeDemonstration: CreateDemonstrationFormData;
  setActiveDemonstration: React.Dispatch<React.SetStateAction<CreateDemonstrationFormData>>;
}) => {
  return (
    <form id="demonstration-form" className="flex flex-col gap-[24px]">
      <div className="grid grid-cols-3 gap-[24px]">
        <SelectUSAStates
          label="State/Territory"
          value={activeDemonstration.stateId}
          isRequired
          onSelect={(stateId) => setActiveDemonstration({ ...activeDemonstration, stateId })}
        />
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
            value={activeDemonstration.projectOfficerUserId}
            onSelect={(projectOfficerUserId) =>
              setActiveDemonstration({ ...activeDemonstration, projectOfficerUserId })
            }
            personTypes={["demos-admin", "demos-cms-user"]}
          />
        </div>
      </div>

      <div className="flex flex-col gap-xs">
        <Textarea
          name={DEMONSTRATION_DIALOG_DESCRIPTION_NAME}
          label="Demonstration Description"
          placeholder="Enter description"
          value={activeDemonstration.description}
          onChange={(description) =>
            setActiveDemonstration({ ...activeDemonstration, description })
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-xs">
          <SelectSdgDivision
            onSelect={(sdgDivision) =>
              setActiveDemonstration({ ...activeDemonstration, sdgDivision })
            }
          />
        </div>
        <SelectSignatureLevel
          initialValue={DEFAULT_DEMONSTRATION_SIGNATURE_LEVEL}
          allowedSignatureLevels={["OA"]}
          isDisabled
          onSelect={() => {}}
        />
      </div>
    </form>
  );
};
