import React from "react";
import { Textarea, TextInput } from "components/input";
import { SignatureLevel } from "demos-server";
import { SelectSignatureLevel } from "components/input/select/SelectSignatureLevel";
import { SelectDemonstration } from "components/input/select/SelectDemonstration";

export type ModificationFormData = {
  demonstrationId?: string;
  name?: string;
  description?: string;
  effectiveDate?: string;
  signatureLevel?: SignatureLevel;
};

export const ModificationForm: React.FC<{
  initialDemonstrationId?: string;
  modificationType: "Amendment" | "Extension";
  modificationFormData: ModificationFormData;
  setModificationFormData: (updater: (prev: ModificationFormData) => ModificationFormData) => void;
}> = ({
  initialDemonstrationId,
  modificationType,
  modificationFormData,
  setModificationFormData,
}) => {
  return (
    <>
      <SelectDemonstration
        isRequired
        onSelect={(demonstrationId) =>
          setModificationFormData((prev) => ({
            ...prev,
            demonstrationId: demonstrationId,
          }))
        }
        isDisabled={!!initialDemonstrationId}
        value={modificationFormData.demonstrationId || ""}
      />
      <div className="flex gap-4">
        <div className="flex-[2]">
          <TextInput
            name="name"
            label={`${modificationType} Title`}
            placeholder={`Enter ${modificationType.toLowerCase()} title`}
            isRequired
            value={modificationFormData.name}
            onChange={(e) =>
              setModificationFormData((prev) => ({
                ...prev,
                name: e.target.value,
              }))
            }
          />
        </div>
        <div className="flex-[1]">
          <SelectSignatureLevel
            onSelect={(signatureLevel) =>
              setModificationFormData((prev) => ({
                ...prev,
                signatureLevel: signatureLevel,
              }))
            }
            initialValue={modificationFormData.signatureLevel}
          />
        </div>
      </div>
      <Textarea
        name={"description"}
        label={`${modificationType} Description`}
        onChange={(e) =>
          setModificationFormData((prev) => ({
            ...prev,
            description: e.target.value,
          }))
        }
        initialValue={modificationFormData.description || ""}
        placeholder={`Enter ${modificationType.toLowerCase()} description`}
      />
    </>
  );
};
