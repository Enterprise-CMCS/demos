import React, { useState } from "react";
import { ModificationForm, ModificationFormData } from "./ModificationForm";
import { gql, useMutation } from "@apollo/client";
import { useToast } from "components/toast";
import { BaseDialog } from "../BaseDialog";
import { useDialog } from "../DialogContext";
import { Button } from "components/button";
import { SelectDemonstration } from "components/input/select/SelectDemonstration";

export const CREATE_EXTENSION_MUTATION = gql`
  mutation CreateExtension($input: CreateExtensionInput!) {
    createExtension(input: $input) {
      demonstration {
        id
        extensions {
          id
        }
      }
    }
  }
`;

export const CreateExtensionDialog: React.FC<{
  demonstrationId?: string;
}> = ({ demonstrationId }) => {
  const { showSuccess, showError } = useToast();
  const { closeDialog } = useDialog();
  const [save, { loading: saving }] = useMutation(CREATE_EXTENSION_MUTATION);

  const [createExtensionFormData, setCreateExtensionFormData] = useState<ModificationFormData>({
    demonstrationId: demonstrationId,
  });

  

  const handleSubmit = async () => {
    try {
      await save({
        variables: {
          input: {
            demonstrationId: createExtensionFormData.demonstrationId,
            name: createExtensionFormData.name,
            description: createExtensionFormData.description,
            effectiveDate: createExtensionFormData.effectiveDate,
            signatureLevel: createExtensionFormData.signatureLevel,
          },
        },
      });
      showSuccess("Extension created successfully.");
    } catch (error) {
      showError("Failed to create extension.");
      console.error("Error creating extension:", error);
    }
    closeDialog();
  };

  return (
    <BaseDialog
      title="Create Extension"
      onClose={closeDialog}
      dialogHasChanges={hasChanges()}
      maxWidthClass="max-w-[920px]"
      actionButton={
        <Button
          name={"button-submit-create-extension-dialog"}
          disabled={saving || !hasChanges()}
          onClick={handleSubmit}
        >
          Apply Type(s)
        </Button>
      }
    >
      <>
        <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-gray-300">
          <SelectDemonstration
            isRequired
            onSelect={(demonstrationId) =>
              setCreateExtensionFormData((prev) => ({
                ...prev,
                demonstrationId: demonstrationId,
              }))
            }
            isDisabled={!!demonstrationId}
            value={createExtensionFormData.demonstrationId || ""}
          />
          <ModificationForm
            modificationType="Extension"
            modificationFormData={createExtensionFormData}
            setModificationFormData={setCreateExtensionFormData}
          />
        </div>
      </>
    </BaseDialog>
  );
};
