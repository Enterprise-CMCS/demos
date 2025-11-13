import React, { useEffect, useState } from "react";
import { DocumentNode, gql, useLazyQuery, useMutation } from "@apollo/client";
import { BaseDialog } from "../BaseDialog";
import { Button, SecondaryButton } from "components/button";
import { SelectDemonstration } from "components/input/select/SelectDemonstration";
import { TextInput } from "components/input";
import { SelectUSAStates } from "components/input/select/SelectUSAStates";
import { tw } from "tags/tw";
import { useToast } from "components/toast";

export type CreateModificationDialogProps = {
  onClose: () => void;
  initialDemonstrationId?: string;
};

export const CREATE_MODIFICATION_DIALOG_QUERY = gql`
  query CreateModificationDialog($id: ID!) {
    demonstration(id: $id) {
      id
      primaryProjectOfficer {
        id
      }
      state {
        id
      }
    }
  }
`;

type CreateModificationFormFields = {
  name?: string;
  description?: string;
  stateId?: string;
};

interface BaseCreateModificationDialogProps {
  onClose: () => void;
  initialDemonstrationId?: string;
  modificationType: "Amendment" | "Extension";
  createModificationDialogMutation: DocumentNode;
}

export const BaseCreateModificationDialog: React.FC<BaseCreateModificationDialogProps> = ({
  onClose,
  initialDemonstrationId,
  modificationType,
  createModificationDialogMutation,
}) => {
  const [demonstrationId, setDemonstrationId] = useState(initialDemonstrationId);
  const [createModificationFormFields, setCreateModificationFormFields] =
    useState<CreateModificationFormFields>({});
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const { showSuccess, showError } = useToast();

  const [
    triggerCreateModificationDialogQuery,
    { data: createModificationDialogQueryData, error: createModificationDialogQueryError },
  ] = useLazyQuery(CREATE_MODIFICATION_DIALOG_QUERY, {
    variables: { id: demonstrationId },
  });

  const [
    triggerCreateModificationDialogMutation,
    {
      data: createModificationDialogMutationData,
      loading: createModificationDialogMutationLoading,
      error: createModificationDialogMutationError,
    },
  ] = useMutation(createModificationDialogMutation, {
    variables: {
      input: {
        name: createModificationFormFields.name,
        description: createModificationFormFields.description,
        demonstrationId,
      },
    },
  });

  useEffect(() => {
    if (demonstrationId) {
      triggerCreateModificationDialogQuery();
    }
  }, [demonstrationId]);

  const demonstration = createModificationDialogQueryData?.demonstration;
  useEffect(() => {
    if (!demonstration) return;
    setCreateModificationFormFields((fields) => ({
      ...fields,
      stateId: demonstration.state.id,
    }));
  }, [demonstration]);

  useEffect(() => {
    if (createModificationDialogMutationData) {
      showSuccess(`${modificationType} created successfully.`);
      onClose();
    }
    if (createModificationDialogMutationError) {
      showError(`Error creating ${modificationType.toLowerCase()}.`);
      console.error(createModificationDialogMutationError);
      onClose();
    }
    if (createModificationDialogQueryError) {
      showError("Error loading demonstration data.");
      console.error(createModificationDialogQueryError);
      onClose();
    }
  }, [
    createModificationDialogMutationData,
    createModificationDialogMutationError,
    createModificationDialogQueryError,
    showSuccess,
    showError,
    onClose,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await triggerCreateModificationDialogMutation();
    } catch (error) {
      console.error("Error during mutation:", error);
    }
  };

  return (
    <BaseDialog
      title={`New ${modificationType}`}
      onClose={onClose}
      showCancelConfirm={showCancelConfirm}
      setShowCancelConfirm={setShowCancelConfirm}
      maxWidthClass="max-w-[720px]"
      actions={
        <>
          <SecondaryButton
            name={`button-cancel-create-${modificationType.toLowerCase()}`}
            size="small"
            onClick={() => setShowCancelConfirm(true)}
          >
            Cancel
          </SecondaryButton>
          <Button
            name={`button-submit-create-${modificationType.toLowerCase()}`}
            size="small"
            type="submit"
            form={`create-${modificationType.toLowerCase()}`}
            disabled={
              !(demonstrationId && createModificationFormFields.name) ||
              createModificationDialogMutationLoading
            }
          >
            {createModificationDialogMutationLoading ? "Saving..." : "Submit"}
          </Button>
        </>
      }
    >
      <form
        id={`create-${modificationType.toLowerCase()}`}
        className="space-y-4"
        onSubmit={handleSubmit}
      >
        <div>
          <SelectDemonstration
            isRequired
            isDisabled={!!initialDemonstrationId}
            onSelect={setDemonstrationId}
            value={demonstrationId}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <TextInput
              name="title"
              label={`${modificationType} Title`}
              placeholder={`Enter ${modificationType.toLowerCase()} title`}
              isRequired
              value={createModificationFormFields.name}
              onChange={(e) =>
                setCreateModificationFormFields({
                  ...createModificationFormFields,
                  name: e.target.value,
                })
              }
            />
          </div>
          <div>
            <SelectUSAStates
              label="State/Territory"
              isRequired
              isDisabled
              value={demonstration?.state.id}
              onSelect={() => {}}
            />
          </div>
        </div>

        <div className="flex flex-col gap-sm">
          <label
            className={tw`text-text-font font-bold text-field-label flex gap-0-5`}
            htmlFor="description"
          >
            {`${modificationType} Description`}
          </label>
          <textarea
            id="description"
            placeholder={`Enter ${modificationType.toLowerCase()} description`}
            className="w-full border border-border-fields rounded px-1 py-1 text-sm resize-y min-h-[80px]"
            data-testid="textarea-description"
            value={createModificationFormFields.description}
            onChange={(e) =>
              setCreateModificationFormFields({
                ...createModificationFormFields,
                description: e.target.value,
              })
            }
          />
        </div>
      </form>
    </BaseDialog>
  );
};
