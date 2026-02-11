import React from "react";
import { Textarea, TextInput } from "components/input";
import { SignatureLevel } from "demos-server";
import { SelectSignatureLevel } from "components/input/select/SelectSignatureLevel";

export type ModificationFormData = {
  demonstrationId?: string;
  name?: string;
  description?: string;
  effectiveDate?: string;
  signatureLevel?: SignatureLevel;
};

export const ModificationForm: React.FC<{
  modificationType: "Amendment" | "Extension";
  modificationFormData: ModificationFormData;
  setModificationFormData: (updater: (prev: ModificationFormData) => ModificationFormData) => void;
}> = ({ modificationType, modificationFormData, setModificationFormData }) => {
  return (
    <>
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
      <SelectSignatureLevel
        onSelect={(signatureLevel) =>
          setModificationFormData((prev) => ({
            ...prev,
            signatureLevel: signatureLevel,
          }))
        }
        initialValue={modificationFormData.signatureLevel}
      />
    </>
  );
};
