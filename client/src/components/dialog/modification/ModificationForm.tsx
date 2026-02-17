import React from "react";
import { Textarea, TextInput } from "components/input";
import { SignatureLevel } from "demos-server";
import { SelectSignatureLevel } from "components/input/select/SelectSignatureLevel";
import { SelectDemonstration } from "components/input/select/SelectDemonstration";

export type ModificationFormData = {
  id?: string;
  name?: string;
  description?: string;
  signatureLevel?: SignatureLevel;
  demonstrationId?: string;
};

export const ModificationForm: React.FC<{
  showDemonstrationSelect?: boolean;
  modificationType: "Amendment" | "Extension";
  modificationFormData: ModificationFormData;
  setModificationFormDataField: (field: Partial<ModificationFormData>) => void;
}> = ({
  showDemonstrationSelect,
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
      <div className="w-1/2">
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
