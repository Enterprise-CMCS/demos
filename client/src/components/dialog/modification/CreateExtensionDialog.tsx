import React, { useState } from "react";
import { ModificationForm, hasChanges, isValid, ModificationFormData } from "./ModificationForm";
import { gql, useMutation } from "@apollo/client";
import { useToast } from "components/toast";
import { BaseDialog } from "../BaseDialog";
import { useDialog } from "../DialogContext";
import { Button } from "components/button";

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
  const initialModification = demonstrationId ? { demonstration: { id: demonstrationId } } : {};
  const { showSuccess, showError } = useToast();
  const { closeDialog } = useDialog();
  const [save, { loading: saving }] = useMutation(CREATE_EXTENSION_MUTATION);

  const [createExtensionFormData, setCreateExtensionFormData] = useState<ModificationFormData>({
    id: demonstrationId,
  });

  const handleSubmit = async () => {
    try {
      await save({
        variables: {
          input: {
            demonstrationId: createExtensionFormData.demonstrationId,
            name: createExtensionFormData.name,
            description: createExtensionFormData.description,
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
      title="Add Extension"
      onClose={closeDialog}
      dialogHasChanges={hasChanges(createExtensionFormData, initialModification)}
      maxWidthClass="max-w-[920px]"
      actionButton={
        <Button
          name={"button-submit-create-extension-dialog"}
          disabled={
            saving ||
            !hasChanges(createExtensionFormData, initialModification) ||
            !isValid(createExtensionFormData)
          }
          onClick={handleSubmit}
        >
          Create Extension
        </Button>
      }
    >
      <>
        <div className="flex flex-col gap-2">
          <ModificationForm
            mode="create"
            showDemonstrationSelect={!demonstrationId}
            modificationType="Extension"
            modificationFormData={createExtensionFormData}
            setModificationFormDataField={(field: Partial<ModificationFormData>) =>
              setCreateExtensionFormData((prev) => ({ ...prev, ...field }))
            }
          />
        </div>
      </>
    </BaseDialog>
  );
};
