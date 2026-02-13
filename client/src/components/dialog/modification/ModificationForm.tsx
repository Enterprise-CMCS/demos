import React from "react";
import { Textarea, TextInput } from "components/input";
import { LocalDate, SignatureLevel } from "demos-server";
import { SelectSignatureLevel } from "components/input/select/SelectSignatureLevel";
import { SelectDemonstration } from "components/input/select/SelectDemonstration";
import { DatePicker } from "components/input/date/DatePicker";

export type ModificationFormData = {
  id?: string;
  name?: string;
  description?: string;
  effectiveDate?: LocalDate;
  signatureLevel?: SignatureLevel;
  demonstrationId?: string;
};

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
      <div className="flex gap-4">
        <div className={mode === "edit" ? "flex-[2]" : "flex-[1]"}>
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
          <div className="flex-[1]">
            <DatePicker
              name="date-picker-effective-date"
              label="Effective Date"
              isRequired
              value={modificationFormData.effectiveDate || ""}
              onChange={(date) =>
                setModificationFormDataField({ effectiveDate: date as LocalDate })
              }
            />
          </div>
        )}
      </div>
      <Textarea
        name={"description"}
        label={`${modificationType} Description`}
        onChange={(e) =>
          setModificationFormDataField({
            description: e.target.value,
          })
        }
        initialValue={modificationFormData.description || ""}
        placeholder={`Enter ${modificationType.toLowerCase()} description`}
      />
      <div>
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
