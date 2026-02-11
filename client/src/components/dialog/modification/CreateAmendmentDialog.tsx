import React, { useState } from "react";
import { ModificationForm, ModificationFormData } from "./ModificationForm";
import { gql, useMutation } from "@apollo/client";
import { useToast } from "components/toast";
import { BaseDialog } from "../BaseDialog";
import { useDialog } from "../DialogContext";
import { Button } from "components/button";
import { SelectDemonstration } from "components/input/select/SelectDemonstration";

export const CREATE_AMENDMENT_MUTATION = gql`
  mutation CreateAmendment($input: CreateAmendmentInput!) {
    createAmendment(input: $input) {
      demonstration {
        id
        amendments {
          id
        }
      }
    }
  }
`;

export const CreateAmendmentDialog: React.FC<{
  demonstrationId?: string;
}> = ({ demonstrationId }) => {
  const { showSuccess, showError } = useToast();
  const { closeDialog } = useDialog();
  const [save, { loading: saving }] = useMutation(CREATE_AMENDMENT_MUTATION);

  const [createAmendmentFormData, setCreateAmendmentFormData] = useState<ModificationFormData>({
    demonstrationId: demonstrationId,
  });

  const hasChanges = () => {
    return true;
  };

  const handleSubmit = async () => {
    try {
      await save({
        variables: {
          input: {
            demonstrationId: createAmendmentFormData.demonstrationId,
            name: createAmendmentFormData.name,
            description: createAmendmentFormData.description,
            effectiveDate: createAmendmentFormData.effectiveDate,
            signatureLevel: createAmendmentFormData.signatureLevel,
          },
        },
      });
      showSuccess("Amendment created successfully.");
    } catch (error) {
      showError("Failed to create amendment.");
      console.error("Error creating amendment:", error);
    }
    closeDialog();
  };

  return (
    <BaseDialog
      title="Create Amendment"
      onClose={closeDialog}
      dialogHasChanges={hasChanges()}
      maxWidthClass="max-w-[920px]"
      actionButton={
        <Button
          name={"button-submit-create-amendment-dialog"}
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
              setCreateAmendmentFormData((prev) => ({
                ...prev,
                demonstrationId: demonstrationId,
              }))
            }
            isDisabled={!!demonstrationId}
            value={createAmendmentFormData.demonstrationId || ""}
          />
          <ModificationForm
            mode="create"
            modificationType="Amendment"
            modificationFormData={createAmendmentFormData}
            setModificationFormData={setCreateAmendmentFormData}
          />
        </div>
      </>
    </BaseDialog>
  );
};
