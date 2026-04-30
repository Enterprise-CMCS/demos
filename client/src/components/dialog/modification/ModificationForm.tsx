import React from "react";
import { Textarea, TextInput } from "components/input";
import { LocalDate, SignatureLevel } from "demos-server";
import { SelectSignatureLevel } from "components/input/select/SelectSignatureLevel";
import { SelectDemonstration } from "components/input/select/SelectDemonstration";
import { DatePicker } from "components/input/date/DatePicker";
import { formatDateForServer } from "util/formatDate";

export type Modification = {
  id: string;
  name: string;
  demonstration: {
    id: string;
  };
  description: string | null;
  effectiveDate: string | null;
  signatureLevel: SignatureLevel | null;
};

export type ModificationFormData = {
  id?: string;
  name?: string;
  description?: string;
  signatureLevel?: SignatureLevel;
  demonstrationId?: string;
  effectiveDate?: LocalDate;
};

export const isValid = (createModificationFormData: ModificationFormData): boolean => {
  return !!createModificationFormData.demonstrationId && !!createModificationFormData.name;
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
  modificationType: "Amendment" | "Extension";
  modificationFormData: ModificationFormData;
  setModificationFormDataField: (field: Partial<ModificationFormData>) => void;
}> = ({
  showDemonstrationSelect,
  mode,
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
              value={modificationFormData.effectiveDate}
              onChange={(date) =>
                setModificationFormDataField({
                  effectiveDate: date as LocalDate,
                })
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
          onSelect={(signatureLevel) =>
            setModificationFormDataField({
              signatureLevel: signatureLevel,
            })
          }
          initialValue={modificationFormData.signatureLevel}
        />
      </div>
    </>
  );
};
