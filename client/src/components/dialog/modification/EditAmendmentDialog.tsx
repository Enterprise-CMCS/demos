import React, { useEffect, useState } from "react";
import { ModificationForm, ModificationFormData } from "./ModificationForm";
import { gql, TypedDocumentNode, useMutation, useQuery } from "@apollo/client";
import { useToast } from "components/toast";
import { BaseDialog } from "../BaseDialog";
import { useDialog } from "../DialogContext";
import { Button } from "components/button";
import { formatDateForServer } from "util/formatDate";
import { SignatureLevel, UpdateAmendmentInput } from "demos-server";

type Amendment = {
  id: string;
  name: string;
  description: string | null;
  effectiveDate: string | null;
  signatureLevel: SignatureLevel | null;
};

export const UPDATE_AMENDMENT_MUTATION: TypedDocumentNode<
  { updateAmendment: Amendment },
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
  { amendment: Amendment },
  { id: string }
> = gql`
  query UpdateAmendmentDialog($id: ID!) {
    amendment(id: $id) {
      id
      name
      effectiveDate
      description
      signatureLevel
    }
  }
`;

const hasChanges = (initialAmendment: Amendment, editAmendmentFormData: ModificationFormData) => {
  const initialEffectiveDate = initialAmendment.effectiveDate
    ? formatDateForServer(initialAmendment.effectiveDate)
    : undefined;

  if (initialAmendment.name !== editAmendmentFormData.name) return true;
  if (initialAmendment.description !== editAmendmentFormData.description) return true;
  if (initialEffectiveDate !== editAmendmentFormData.effectiveDate) return true;
  if (initialAmendment.signatureLevel !== editAmendmentFormData.signatureLevel) return true;

  return false;
};

const isValid = (editAmendmentFormData: ModificationFormData) => {
  return !!editAmendmentFormData.name && !!editAmendmentFormData.effectiveDate;
};

const getFormDataFromAmendment = (amendment: Amendment) => ({
  name: amendment.name,
  description: amendment.description || undefined,
  effectiveDate: amendment.effectiveDate ? formatDateForServer(amendment.effectiveDate) : undefined,
  signatureLevel: amendment.signatureLevel || undefined,
});

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
  >(data && getFormDataFromAmendment(data.amendment));

  useEffect(() => {
    if (data?.amendment) {
      setUpdateAmendmentFormData(getFormDataFromAmendment(data.amendment));
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
      title="Update Amendment"
      onClose={closeDialog}
      dialogHasChanges={
        data && updateAmendmentFormData && hasChanges(data.amendment, updateAmendmentFormData)
      }
      maxWidthClass="max-w-[920px]"
      actionButton={
        <Button
          name={"button-submit-update-amendment-dialog"}
          disabled={
            !updateAmendmentFormData ||
            !data ||
            saving ||
            !hasChanges(data.amendment, updateAmendmentFormData) ||
            !isValid(updateAmendmentFormData)
          }
          onClick={handleSubmit}
        >
          Update Amendment
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
