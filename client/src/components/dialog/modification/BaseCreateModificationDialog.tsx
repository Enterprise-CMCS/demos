import React, { useState } from "react";
import { ModificationForm, hasChanges, isValid, ModificationFormData } from "./ModificationForm";
import { useToast } from "components/toast";
import { BaseDialog } from "../BaseDialog";
import { useDialog } from "../DialogContext";
import { Button } from "components/button";

export const BaseCreateModificationDialog: React.FC<{
  modificationType: "Amendment" | "Extension";
  useModification: () => {
    save: (input: ModificationFormData) => Promise<void>;
    saving: boolean;
  };
  demonstrationId?: string;
}> = ({ modificationType, useModification, demonstrationId }) => {
  const initialModification = demonstrationId ? { demonstration: { id: demonstrationId } } : {};
  const { showSuccess, showError } = useToast();
  const { closeDialog } = useDialog();
  const { save, saving } = useModification();

  const [formData, setFormData] = useState<ModificationFormData>({
    demonstrationId,
  });

  const handleSubmit = async () => {
    try {
      await save(formData);
      showSuccess(`${modificationType} created successfully.`);
    } catch (error) {
      showError(`Failed to create ${modificationType.toLowerCase()}.`);
      console.error(`Error creating ${modificationType.toLowerCase()}:`, error);
    }
    closeDialog();
  };

  return (
    <BaseDialog
      title={`Add ${modificationType}`}
      onClose={closeDialog}
      dialogHasChanges={hasChanges(formData, initialModification)}
      maxWidthClass="max-w-[920px]"
      actionButton={
        <Button
          name={`button-submit-create-${modificationType.toLowerCase()}-dialog`}
          disabled={saving || !hasChanges(formData, initialModification) || !isValid(formData)}
          onClick={handleSubmit}
        >
          Create {modificationType}
        </Button>
      }
    >
      <div className="flex flex-col gap-2">
        <ModificationForm
          showDemonstrationSelect={!demonstrationId}
          modificationType={modificationType}
          modificationFormData={formData}
          setModificationFormDataField={(field: Partial<ModificationFormData>) =>
            setFormData((prev) => ({ ...prev, ...field }))
          }
        />
      </div>
    </BaseDialog>
  );
};
