import React, { useEffect, useState } from "react";
import {
  ModificationForm,
  getFormDataFromModification,
  hasChanges,
  isValid,
  Modification,
  ModificationFormData,
} from "./ModificationForm";
import { gql, TypedDocumentNode, useMutation, useQuery } from "@apollo/client";
import { useToast } from "components/toast";
import { BaseDialog } from "../BaseDialog";
import { useDialog } from "../DialogContext";
import { Button } from "components/button";
import { UpdateExtensionInput } from "demos-server";

export const UPDATE_EXTENSION_MUTATION: TypedDocumentNode<
  { updateExtension: Modification },
  { id: string; input: UpdateExtensionInput }
> = gql`
  mutation UpdateExtension($id: ID!, $input: UpdateExtensionInput!) {
    updateExtension(id: $id, input: $input) {
      id
      name
      description
      effectiveDate
      signatureLevel
      demonstration {
        id
      }
    }
  }
`;

export const UPDATE_EXTENSION_DIALOG_QUERY: TypedDocumentNode<
  { extension: Modification },
  { id: string }
> = gql`
  query UpdateExtensionDialog($id: ID!) {
    extension(id: $id) {
      id
      name
      description
      effectiveDate
      signatureLevel
      demonstration {
        id
      }
    }
  }
`;

export const UpdateExtensionDialog: React.FC<{
  extensionId: string;
}> = ({ extensionId }) => {
  const { showSuccess, showError } = useToast();
  const { closeDialog } = useDialog();
  const [save, { loading: saving }] = useMutation(UPDATE_EXTENSION_MUTATION);
  const { data, error } = useQuery(UPDATE_EXTENSION_DIALOG_QUERY, {
    variables: { id: extensionId },
  });
  const [updateExtensionFormData, setUpdateExtensionFormData] = useState<
    ModificationFormData | undefined
  >(data && getFormDataFromModification(data.extension));

  useEffect(() => {
    if (data?.extension) {
      setUpdateExtensionFormData(getFormDataFromModification(data.extension));
    }
  }, [data]);

  const handleSubmit = async () => {
    if (!updateExtensionFormData) {
      showError("Form data is not loaded yet.");
      return;
    }
    try {
      await save({
        variables: {
          id: extensionId,
          input: updateExtensionFormData,
        },
      });
      showSuccess("Extension updated successfully.");
    } catch (error) {
      showError("Failed to update extension.");
      console.error("Error creating extension:", error);
    }
    closeDialog();
  };

  return (
    <BaseDialog
      title="Edit Details"
      onClose={closeDialog}
      dialogHasChanges={
        data && updateExtensionFormData && hasChanges(updateExtensionFormData, data.extension)
      }
      maxWidthClass="max-w-[920px]"
      actionButton={
        <Button
          name={"button-submit-update-extension-dialog"}
          disabled={
            !updateExtensionFormData ||
            !data ||
            saving ||
            !hasChanges(updateExtensionFormData, data.extension) ||
            !isValid(updateExtensionFormData)
          }
          onClick={handleSubmit}
        >
          Save Changes
        </Button>
      }
    >
      <>
        {error && <p>Error loading Extension</p>}
        {!updateExtensionFormData ? (
          <p>Loading...</p>
        ) : (
          <div className="flex flex-col gap-2">
            <ModificationForm
              mode="edit"
              modificationType="Extension"
              modificationFormData={updateExtensionFormData}
              setModificationFormDataField={(field: Partial<ModificationFormData>) =>
                setUpdateExtensionFormData((prev) => ({ ...prev, ...field }))
              }
            />
          </div>
        )}
      </>
    </BaseDialog>
  );
};
