import React from "react";
import {
  BaseCreateModificationDialog,
  CreateModificationFormFields,
} from "./BaseCreateModificationDialog";
import { gql, useMutation } from "@apollo/client";
import { useToast } from "components/toast";
import { Amendment as ServerAmendment, Demonstration } from "demos-server";
import { useDialog } from "../DialogContext";

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
  initialDemonstrationId?: string;
}> = ({ initialDemonstrationId }) => {
  const { hideDialog } = useDialog();
  const { showSuccess, showError } = useToast();
  const [triggerCreateAmendment] = useMutation<{ createAmendment: Amendment }>(
    CREATE_AMENDMENT_MUTATION
  );

  const handleError = (error?: unknown) => {
    showError("Error creating amendment.");
    console.error(error || "Unknown error");
    hideDialog();
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

      if (!result.data?.createAmendment) {
        handleError();
      }

      showSuccess("Amendment created successfully.");
      hideDialog();
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <BaseCreateModificationDialog
      initialDemonstrationId={initialDemonstrationId}
      modificationType="Amendment"
      handleSubmit={createAmendment}
    />
  );
};
