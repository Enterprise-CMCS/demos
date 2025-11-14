import React from "react";
import {
  BaseCreateModificationDialog,
  CreateModificationFormFields,
} from "./BaseCreateModificationDialog";
import { gql, useMutation } from "@apollo/client";
import { useToast } from "components/toast";
import { Amendment as ServerAmendment, Demonstration } from "demos-server";

type Amendment = Pick<ServerAmendment, "id"> & {
  demonstration: Pick<Demonstration, "id"> & {
    amendments: Pick<ServerAmendment, "id">[];
  };
};
export const CREATE_AMENDMENT_MUTATION = gql`
  mutation CreateAmendment($input: CreateAmendmentInput!) {
    createAmendment(input: $input) {
      id
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
  onClose: () => void;
  initialDemonstrationId?: string;
}> = ({ onClose, initialDemonstrationId }) => {
  const { showSuccess, showError } = useToast();
  const [triggerCreateAmendment] = useMutation<{ amendment: Amendment }>(CREATE_AMENDMENT_MUTATION);

  const handleError = (error?: unknown) => {
    showError("Error creating amendment.");
    console.error(error || "Unknown error");
    onClose();
  };

  const createAmendment = async ({
    name,
    description,
    demonstrationId,
  }: CreateModificationFormFields) => {
    try {
      const result = await triggerCreateAmendment({
        variables: {
          input: {
            name: name,
            description: description,
            demonstrationId: demonstrationId,
          },
        },
      });

      if (!result.data?.amendment) {
        handleError();
      }

      showSuccess("Amendment created successfully.");
      onClose();
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <BaseCreateModificationDialog
      onClose={onClose}
      initialDemonstrationId={initialDemonstrationId}
      modificationType="Amendment"
      handleSubmit={createAmendment}
    />
  );
};
