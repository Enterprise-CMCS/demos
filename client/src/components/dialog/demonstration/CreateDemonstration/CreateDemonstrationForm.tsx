import React from "react";
import { SdgDivision } from "demos-server";

import { Textarea } from "components/input";
import { SelectSdgDivision } from "components/input/select/SelectSdgDivision";
import { SelectSignatureLevel } from "components/input/select/SelectSignatureLevel";
import { SelectUSAStates } from "components/input/select/SelectUSAStates";
import { SelectUsers } from "components/input/select/SelectUsers";
import { TextInput } from "components/input/TextInput";

export const DEMONSTRATION_DIALOG_DESCRIPTION_NAME = "textarea-demonstration-description";
export const SUBMIT_BUTTON_NAME = "button-submit-demonstration-dialog";
export const DEFAULT_DEMONSTRATION_SIGNATURE_LEVEL = "OA" as const;

export type CreateDemonstrationFormData = {
  name: string;
  description: string;
  stateId: string;
  sdgDivision?: SdgDivision;
  projectOfficerUserId: string;
};

export const CreateDemonstrationForm = ({
  demonstration,
  setDemonstration,
}: {
  demonstration: CreateDemonstrationFormData;
  setDemonstration: React.Dispatch<React.SetStateAction<CreateDemonstrationFormData>>;
}) => {
  return (
    <form id="demonstration-form" className="flex flex-col gap-[24px]">
      <div className="grid grid-cols-3 gap-[24px]">
        <SelectUSAStates
          label="State/Territory"
          value={demonstration.stateId}
          isRequired
          onSelect={(stateId) => setDemonstration({ ...demonstration, stateId })}
        />
        <div className="col-span-2">
          <TextInput
            name="input-demonstration-title"
            label="Demonstration Title"
            isRequired
            placeholder="Enter title"
            value={demonstration.name}
            onChange={(e) => setDemonstration({ ...demonstration, name: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-2">
          <SelectUsers
            label="Project Officer"
            isRequired={true}
            value={demonstration.projectOfficerUserId}
            onSelect={(projectOfficerUserId) =>
              setDemonstration({ ...demonstration, projectOfficerUserId })
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
          value={demonstration.description}
          onChange={(description) => setDemonstration({ ...demonstration, description })}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-xs">
          <SelectSdgDivision
            onSelect={(sdgDivision) => setDemonstration({ ...demonstration, sdgDivision })}
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
