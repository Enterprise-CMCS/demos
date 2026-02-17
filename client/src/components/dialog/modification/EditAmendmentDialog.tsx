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
import { UpdateAmendmentInput } from "demos-server";

export const UPDATE_AMENDMENT_MUTATION: TypedDocumentNode<
  { updateAmendment: Modification },
  { id: string; input: UpdateAmendmentInput }
> = gql`
  mutation UpdateAmendment($id: ID!, $input: UpdateAmendmentInput!) {
    updateAmendment(id: $id, input: $input) {
      id
      name
      description
      effectiveDate
      signatureLevel
    }
  }
`;

export const UPDATE_AMENDMENT_DIALOG_QUERY: TypedDocumentNode<
  { amendment: Modification },
  { id: string }
> = gql`
  query UpdateAmendmentDialog($id: ID!) {
    amendment(id: $id) {
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

export const UpdateAmendmentDialog: React.FC<{
  amendmentId: string;
}> = ({ amendmentId }) => {
  const { showSuccess, showError } = useToast();
  const { closeDialog } = useDialog();
  const [save, { loading: saving }] = useMutation(UPDATE_AMENDMENT_MUTATION);
  const { data, error } = useQuery(UPDATE_AMENDMENT_DIALOG_QUERY, {
    variables: { id: amendmentId },
  });
  const [updateAmendmentFormData, setUpdateAmendmentFormData] = useState<
    ModificationFormData | undefined
  >(data && getFormDataFromModification(data.amendment));

  useEffect(() => {
    if (data?.amendment) {
      setUpdateAmendmentFormData(getFormDataFromModification(data.amendment));
    }
  }, [data]);

  const handleSubmit = async () => {
    if (!updateAmendmentFormData) {
      showError("Form data is not loaded yet.");
      return;
    }
    try {
      await save({
        variables: {
          id: amendmentId,
          input: updateAmendmentFormData,
        },
      });
      showSuccess("Amendment updated successfully.");
    } catch (error) {
      showError("Failed to update amendment.");
      console.error("Error creating amendment:", error);
    }
    closeDialog();
  };

  return (
    <BaseDialog
      title="Edit Details"
      onClose={closeDialog}
      dialogHasChanges={
        data && updateAmendmentFormData && hasChanges(updateAmendmentFormData, data.amendment)
      }
      maxWidthClass="max-w-[920px]"
      actionButton={
        <Button
          name={"button-submit-update-amendment-dialog"}
          disabled={
            !updateAmendmentFormData ||
            !data ||
            saving ||
            !hasChanges(updateAmendmentFormData, data.amendment) ||
            !isValid(updateAmendmentFormData)
          }
          onClick={handleSubmit}
        >
          Save Changes
        </Button>
      }
    >
      <>
        {error && <p>Error loading Amendment</p>}
        {!updateAmendmentFormData ? (
          <p>Loading...</p>
        ) : (
          <div className="flex flex-col gap-2">
            <ModificationForm
              mode="edit"
              modificationType="Amendment"
              modificationFormData={updateAmendmentFormData}
              setModificationFormDataField={(field: Partial<ModificationFormData>) =>
                setUpdateAmendmentFormData((prev) => ({ ...prev, ...field }))
              }
            />
          </div>
        )}
      </>
    </BaseDialog>
  );
};
