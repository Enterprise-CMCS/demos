import React from "react";
import {
  BaseCreateModificationDialog,
  CreateModificationFormFields,
} from "./BaseCreateModificationDialog";
import { gql, useMutation } from "@apollo/client";
import { useToast } from "components/toast";
import { Extension as ServerExtension, Demonstration } from "demos-server";

type Extension = Pick<ServerExtension, "id"> & {
  demonstration: Pick<Demonstration, "id"> & {
    extensions: Pick<ServerExtension, "id">[];
  };
};
export const CREATE_EXTENSION_MUTATION = gql`
  mutation CreateExtension($input: CreateExtensionInput!) {
    createExtension(input: $input) {
      id
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
  onClose: () => void;
  initialDemonstrationId?: string;
}> = ({ onClose, initialDemonstrationId }) => {
  const { showSuccess, showError } = useToast();
  const [triggerCreateExtension] = useMutation<{ extension: Extension }>(CREATE_EXTENSION_MUTATION);

  const handleError = (error?: unknown) => {
    showError("Error creating extension.");
    console.error(error || "Unknown error");
    onClose();
  };

  const createExtension = async ({
    name,
    description,
    demonstrationId,
  }: CreateModificationFormFields) => {
    try {
      const result = await triggerCreateExtension({
        variables: {
          input: {
            name,
            description,
            demonstrationId,
          },
        },
      });

      if (!result.data?.extension) {
        handleError();
      }

      showSuccess("Extension created successfully.");
      onClose();
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <BaseCreateModificationDialog
      onClose={onClose}
      initialDemonstrationId={initialDemonstrationId}
      modificationType="Extension"
      handleSubmit={createExtension}
    />
  );
};
