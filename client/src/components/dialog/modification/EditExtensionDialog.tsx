import React, { useEffect, useState } from "react";
import { ModificationForm, ModificationFormData } from "./ModificationForm";
import { gql, TypedDocumentNode, useMutation, useQuery } from "@apollo/client";
import { useToast } from "components/toast";
import { BaseDialog } from "../BaseDialog";
import { useDialog } from "../DialogContext";
import { Button } from "components/button";
import { formatDateForServer } from "util/formatDate";
import { SignatureLevel, UpdateExtensionInput } from "demos-server";

type Extension = {
  id: string;
  name: string;
  description: string | null;
  effectiveDate: string | null;
  signatureLevel: SignatureLevel | null;
};

export const UPDATE_EXTENSION_MUTATION: TypedDocumentNode<
  { updateExtension: Extension },
  { id: string; input: UpdateExtensionInput }
> = gql`
  mutation UpdateExtension($id: ID!, $input: UpdateExtensionInput!) {
    updateExtension(id: $id, input: $input) {
      id
      name
      description
      effectiveDate
      signatureLevel
    }
  }
`;

export const UPDATE_EXTENSION_DIALOG_QUERY: TypedDocumentNode<
  { extension: Extension },
  { id: string }
> = gql`
  query UpdateExtensionDialog($id: ID!) {
    extension(id: $id) {
      id
      name
      effectiveDate
      description
      signatureLevel
    }
  }
`;

const hasChanges = (initialExtension: Extension, editExtensionFormData: ModificationFormData) => {
  const initialEffectiveDate = initialExtension.effectiveDate
    ? formatDateForServer(initialExtension.effectiveDate)
    : undefined;

  if (initialExtension.name !== editExtensionFormData.name) return true;
  if (initialExtension.description !== editExtensionFormData.description) return true;
  if (initialEffectiveDate !== editExtensionFormData.effectiveDate) return true;
  if (initialExtension.signatureLevel !== editExtensionFormData.signatureLevel) return true;

  return false;
};

const isValid = (editExtensionFormData: ModificationFormData) => {
  return !!editExtensionFormData.name && !!editExtensionFormData.effectiveDate;
};

const getFormDataFromExtension = (extension: Extension) => ({
  name: extension.name,
  description: extension.description || undefined,
  effectiveDate: extension.effectiveDate ? formatDateForServer(extension.effectiveDate) : undefined,
  signatureLevel: extension.signatureLevel || undefined,
});

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
  >(data && getFormDataFromExtension(data.extension));

  useEffect(() => {
    if (data?.extension) {
      setUpdateExtensionFormData(getFormDataFromExtension(data.extension));
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
      title="Update Extension"
      onClose={closeDialog}
      dialogHasChanges={
        data && updateExtensionFormData && hasChanges(data.extension, updateExtensionFormData)
      }
      maxWidthClass="max-w-[920px]"
      actionButton={
        <Button
          name={"button-submit-update-extension-dialog"}
          disabled={
            !updateExtensionFormData ||
            !data ||
            saving ||
            !hasChanges(data.extension, updateExtensionFormData) ||
            !isValid(updateExtensionFormData)
          }
          onClick={handleSubmit}
        >
          Update Extension
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
