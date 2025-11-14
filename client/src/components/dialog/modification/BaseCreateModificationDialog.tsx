import React, { useState } from "react";
import { gql, useQuery } from "@apollo/client";
import { BaseDialog } from "../BaseDialog";
import { Button, SecondaryButton } from "components/button";
import { SelectDemonstration } from "components/input/select/SelectDemonstration";
import { TextInput } from "components/input";
import { SelectUSAStates } from "components/input/select/SelectUSAStates";
import { tw } from "tags/tw";
import { useToast } from "components/toast";
import { Demonstration as ServerDemonstration, State } from "demos-server";

type Demonstration = Pick<ServerDemonstration, "id"> & {
  state: Pick<State, "id">;
};
export const CREATE_MODIFICATION_DIALOG_QUERY = gql`
  query CreateModificationDialog($id: ID!) {
    demonstration(id: $id) {
      id
      state {
        id
      }
    }
  }
`;

export type CreateModificationFormFields = {
  demonstrationId?: string;
  name?: string;
  description?: string;
  stateId?: string;
};

interface BaseCreateModificationDialogProps {
  onClose: () => void;
  initialDemonstrationId?: string;
  modificationType: "Amendment" | "Extension";
  handleSubmit: (formFields: CreateModificationFormFields) => Promise<void>;
}
export const BaseCreateModificationDialog: React.FC<BaseCreateModificationDialogProps> = ({
  onClose,
  initialDemonstrationId,
  modificationType,
  handleSubmit,
}) => {
  const [loading, setLoading] = useState(false);
  const [createModificationFormFields, setCreateModificationFormFields] =
    useState<CreateModificationFormFields>({
      demonstrationId: initialDemonstrationId,
    });
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const { showError } = useToast();

  useQuery<{ demonstration: Demonstration }>(CREATE_MODIFICATION_DIALOG_QUERY, {
    variables: { id: createModificationFormFields.demonstrationId },
    skip: !createModificationFormFields.demonstrationId,
    onCompleted: (data) => {
      setCreateModificationFormFields((fields) => ({
        ...fields,
        stateId: data.demonstration.state.id,
      }));
    },
    onError: (error) => {
      showError("Error loading demonstration data.");
      console.error(error);
      onClose();
    },
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await handleSubmit(createModificationFormFields);
    } catch (error) {
      console.error("Error during mutation:", error);
    } finally {
      setLoading(false);
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
              !(
                createModificationFormFields.demonstrationId && createModificationFormFields.name
              ) || loading
            }
          >
            {loading ? "Saving..." : "Submit"}
          </Button>
        </>
      }
    >
      <form
        id={`create-${modificationType.toLowerCase()}`}
        className="space-y-4"
        onSubmit={onSubmit}
      >
        <div>
          <SelectDemonstration
            isRequired
            isDisabled={!!initialDemonstrationId}
            onSelect={(value) => {
              setCreateModificationFormFields({
                ...createModificationFormFields,
                demonstrationId: value,
              });
            }}
            value={createModificationFormFields.demonstrationId}
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
              value={createModificationFormFields.stateId}
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
