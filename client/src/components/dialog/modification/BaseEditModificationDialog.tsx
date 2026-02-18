import React, { useEffect, useState } from "react";
import {
  ModificationForm,
  getFormDataFromModification,
  hasChanges,
  isValid,
  Modification,
  ModificationFormData,
} from "./ModificationForm";
import { useToast } from "components/toast";
import { BaseDialog } from "../BaseDialog";
import { useDialog } from "../DialogContext";
import { Button } from "components/button";
import { ApolloError } from "@apollo/client";

export const BaseEditModificationDialog: React.FC<{
  modificationType: "Amendment" | "Extension";
  useModification: () => {
    modification: Modification | undefined;
    error: ApolloError | undefined;
    save: (input: ModificationFormData) => Promise<void>;
    saving: boolean;
  };
}> = ({ modificationType, useModification }) => {
  const { showSuccess, showError } = useToast();
  const { closeDialog } = useDialog();
  const { modification, error, save, saving } = useModification();

  const [formData, setFormData] = useState<ModificationFormData | undefined>(
    modification && getFormDataFromModification(modification)
  );

  useEffect(() => {
    if (modification) {
      setFormData(getFormDataFromModification(modification));
    }
  }, [modification]);

  const handleSubmit = async () => {
    if (!formData) {
      showError("Form data is not loaded yet.");
      return;
    }
    try {
      await save(formData);
      showSuccess(`${modificationType} updated successfully.`);
    } catch (error) {
      showError(`Failed to update ${modificationType.toLowerCase()}.`);
      console.error(`Error updating ${modificationType.toLowerCase()}:`, error);
    }
    closeDialog();
  };

  return (
    <BaseDialog
      title="Edit Details"
      onClose={closeDialog}
      dialogHasChanges={modification && formData && hasChanges(formData, modification)}
      maxWidthClass="max-w-[920px]"
      actionButton={
        <Button
          name={`button-submit-update-${modificationType.toLowerCase()}-dialog`}
          disabled={
            !formData ||
            !modification ||
            saving ||
            !hasChanges(formData, modification) ||
            !isValid(formData)
          }
          onClick={handleSubmit}
        >
          Save Changes
        </Button>
      }
    >
      <>
        {error && <p>Error loading {modificationType}</p>}
        {!formData ? (
          <p>Loading...</p>
        ) : (
          <div className="flex flex-col gap-2">
            <ModificationForm
              mode="edit"
              modificationType={modificationType}
              modificationFormData={formData}
              setModificationFormDataField={(field: Partial<ModificationFormData>) =>
                setFormData((prev) => ({ ...prev, ...field }))
              }
            />
          </div>
        )}
      </>
    </BaseDialog>
  );
};
