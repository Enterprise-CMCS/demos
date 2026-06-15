import React from "react";
import { Textarea, TextInput } from "components/input";
import { ApplicationStatus, SignatureLevel } from "demos-server";
import { SelectSignatureLevel } from "components/input/select/SelectSignatureLevel";
import { SelectDemonstration } from "components/input/select/SelectDemonstration";
import { DatePicker } from "components/input/date/DatePicker";
import { formatDateForServer } from "util/formatDate";
import { getRequiredFieldWhenApprovedMessage } from "util/messages";

export type Modification = {
  id: string;
  name: string;
  demonstration: {
    id: string;
  };
  status: ApplicationStatus;
  description: string | null;
  effectiveDate: string | null;
  signatureLevel: SignatureLevel | null;
};

export type ModificationFormData = {
  id?: string;
  name?: string;
  description?: string;
  signatureLevel?: SignatureLevel | null;
  demonstrationId?: string;
  effectiveDate?: string | null;
};

export const isValid = (
  createModificationFormData: ModificationFormData,
  isApproved?: boolean
): boolean => {
  if (!createModificationFormData.name || !createModificationFormData.demonstrationId) {
    return false;
  }

  if (
    isApproved &&
    (!createModificationFormData.signatureLevel || !createModificationFormData.effectiveDate)
  ) {
    return false;
  }

  return true;
};

export const hasChanges = (
  createModificationFormData: ModificationFormData,
  initialModification: Partial<Modification>
): boolean => {
  const initialEffectiveDate = initialModification.effectiveDate
    ? formatDateForServer(initialModification.effectiveDate)
    : undefined;

  return !!(
    createModificationFormData.name != initialModification.name ||
    createModificationFormData.description != initialModification.description ||
    createModificationFormData.signatureLevel != initialModification.signatureLevel ||
    createModificationFormData.effectiveDate != initialEffectiveDate
  );
};

export const getFormDataFromModification = (
  modification: Partial<Modification>
): ModificationFormData => ({
  name: modification.name,
  description: modification.description ?? undefined,
  effectiveDate: modification.effectiveDate
    ? formatDateForServer(modification.effectiveDate)
    : undefined,
  signatureLevel: modification.signatureLevel ?? undefined,
  demonstrationId: modification.demonstration?.id,
});

export const ModificationForm: React.FC<{
  showDemonstrationSelect?: boolean;
  mode: "create" | "edit";
  isApproved?: boolean;
  modificationType: "Amendment" | "Extension";
  modificationFormData: ModificationFormData;
  setModificationFormDataField: (field: Partial<ModificationFormData>) => void;
}> = ({
  showDemonstrationSelect,
  mode,
  isApproved,
  modificationType,
  modificationFormData,
  setModificationFormDataField,
}) => {
  return (
    <>
      {showDemonstrationSelect && (
        <SelectDemonstration
          isRequired
          onSelect={(demonstrationId) =>
            setModificationFormDataField({
              demonstrationId: demonstrationId,
            })
          }
          value={modificationFormData.demonstrationId || ""}
        />
      )}
      <div className="flex gap-2">
        <div className={mode === "edit" ? "flex-[2]" : "w-1/2"}>
          <TextInput
            name="name"
            label={`${modificationType} Title`}
            placeholder={`Enter ${modificationType.toLowerCase()} title`}
            isRequired
            value={modificationFormData.name}
            onChange={(e) =>
              setModificationFormDataField({
                name: e.target.value,
              })
            }
          />
        </div>
        {mode === "edit" && (
          <div className="flex-1">
            <DatePicker
              name="effectiveDate"
              label="Effective Date"
              isRequired={isApproved}
              value={modificationFormData.effectiveDate ?? undefined}
              onChange={(date) =>
                setModificationFormDataField({
                  effectiveDate: date as string,
                })
              }
              getValidationMessage={() =>
                isApproved && !modificationFormData.effectiveDate
                  ? getRequiredFieldWhenApprovedMessage("Effective Date")
                  : ""
              }
            />
          </div>
        )}
      </div>
      <Textarea
        name={"description"}
        label={`${modificationType} Description`}
        onChange={(value) =>
          setModificationFormDataField({
            description: value,
          })
        }
        value={modificationFormData.description || ""}
        placeholder={`Enter ${modificationType.toLowerCase()} description`}
      />
      <div className="w-1/2">
        <SelectSignatureLevel
          allowedSignatureLevels={["OA", "OCD"]}
          onSelect={(signatureLevel) =>
            setModificationFormDataField({
              signatureLevel: signatureLevel,
            })
          }
          isRequired={isApproved}
          initialValue={modificationFormData.signatureLevel ?? undefined}
        />
        {isApproved && !modificationFormData.signatureLevel && (
          <span className="text-text-warn text-sm">
            {getRequiredFieldWhenApprovedMessage("Signature Level")}
          </span>
        )}
      </div>
    </>
  );
};
