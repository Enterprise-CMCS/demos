import React from "react";
import { LocalDate, SdgDivision, SignatureLevel, UpdateDemonstrationInput } from "demos-server";

import { DatePicker } from "components/input/date/DatePicker";
import { Textarea } from "components/input";
import { SelectSdgDivision } from "components/input/select/SelectSdgDivision";
import { SelectSignatureLevel } from "components/input/select/SelectSignatureLevel";
import { SelectUSAStates } from "components/input/select/SelectUSAStates";
import { SelectUsers } from "components/input/select/SelectUsers";
import { TextInput } from "components/input/TextInput";
import { EXPIRATION_DATE_ERROR_MESSAGE, getRequiredFieldWhenApprovedMessage } from "util/messages";
import { isBefore } from "date-fns";

export const DEMONSTRATION_DIALOG_DESCRIPTION_NAME = "textarea-demonstration-description";
export const SUBMIT_BUTTON_NAME = "button-submit-demonstration-dialog";
export const DEFAULT_DEMONSTRATION_SIGNATURE_LEVEL = "OA" as SignatureLevel;

export type EditDemonstrationFormData = {
  name: string;
  description: string;
  stateId: string;
  sdgDivision?: SdgDivision;
  signatureLevel?: SignatureLevel;
  projectOfficerUserId: string;
  effectiveDate?: LocalDate;
  expirationDate?: LocalDate;
};

export const getUpdateDemonstrationInput = (
  demonstration: EditDemonstrationFormData
): UpdateDemonstrationInput => {
  return {
    ...(demonstration.name && { name: demonstration.name }),
    ...(demonstration.projectOfficerUserId && {
      projectOfficerUserId: demonstration.projectOfficerUserId,
    }),
    description: demonstration.description?.trim() ?? "",
    effectiveDate: demonstration.effectiveDate || null,
    expirationDate: demonstration.expirationDate || null,
    sdgDivision: demonstration.sdgDivision || null,
  };
};

export const EditDemonstrationForm = ({
  demonstration,
  setDemonstration,
  isApproved,
}: {
  demonstration: EditDemonstrationFormData;
  setDemonstration: React.Dispatch<React.SetStateAction<EditDemonstrationFormData>>;
  isApproved: boolean;
}) => {
  return (
    <form id="demonstration-form" className="flex flex-col gap-[24px]">
      <div className="grid grid-cols-3 gap-[24px]">
        <SelectUSAStates
          label="State/Territory"
          value={demonstration.stateId}
          isDisabled
          onSelect={() => {}}
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

        <div className="flex flex-col gap-xs">
          <DatePicker
            isRequired={isApproved}
            name="datepicker-effective-date"
            label="Effective Date"
            value={demonstration.effectiveDate}
            onChange={(effectiveDate) =>
              setDemonstration({
                ...demonstration,
                effectiveDate: effectiveDate as LocalDate,
              })
            }
            getValidationMessage={() =>
              isApproved && !demonstration.effectiveDate
                ? getRequiredFieldWhenApprovedMessage("Effective Date")
                : ""
            }
          />
        </div>
        <div className="flex flex-col gap-xs">
          <DatePicker
            isRequired={isApproved}
            name="datepicker-expiration-date"
            label="Expiration Date"
            value={demonstration.expirationDate}
            onChange={(expirationDate) =>
              setDemonstration({
                ...demonstration,
                expirationDate: expirationDate as LocalDate,
              })
            }
            getValidationMessage={() =>
              isApproved && !demonstration.expirationDate
                ? getRequiredFieldWhenApprovedMessage("Expiration Date")
                : demonstration.expirationDate &&
                    demonstration.effectiveDate &&
                    isBefore(demonstration.expirationDate, demonstration.effectiveDate)
                  ? EXPIRATION_DATE_ERROR_MESSAGE
                  : ""
            }
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
            isRequired={isApproved}
            initialValue={demonstration.sdgDivision}
            onSelect={(sdgDivision) => setDemonstration({ ...demonstration, sdgDivision })}
          />
          {isApproved && !demonstration.sdgDivision && (
            <span className="text-text-warn text-sm">
              {getRequiredFieldWhenApprovedMessage("SDG Division")}
            </span>
          )}
        </div>
        <SelectSignatureLevel
          initialValue={DEFAULT_DEMONSTRATION_SIGNATURE_LEVEL}
          allowedSignatureLevels={["OA"]}
          isDisabled
          onSelect={(signatureLevel) => setDemonstration({ ...demonstration, signatureLevel })}
        />
      </div>
    </form>
  );
};
