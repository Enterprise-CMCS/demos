import React from "react";
import { useToast } from "components/toast";
import { gql, useMutation } from "@apollo/client";
import { CreateExtensionInput, CreateExtensionResponse } from "demos-server";
import { BaseModificationDialog, BaseModificationDialogProps } from "./BaseModificationDialog";

type Props = Pick<
  BaseModificationDialogProps,
  "isOpen" | "onClose" | "demonstrationId" | "data"
> & {
  extensionId?: string; // not used for create; kept for parity/future
};

const ERROR_MESSAGE = "Failed to create extension. Please try again.";

export const CREATE_EXTENSION_MUTATION = gql`
  mutation CreateExtension($input: CreateExtensionInput!) {
    createExtension(input: $input) {
      success
      message
    }
  }
`;

export const CreateExtensionDialog: React.FC<Props> = ({
  isOpen = true,
  onClose,
  demonstrationId,
  data,
}) => {
  const { showError } = useToast();

  const [createExtensionTrigger] = useMutation<{
    createExtension: Pick<CreateExtensionResponse, "success" | "message">;
  }>(CREATE_EXTENSION_MUTATION);

  const onSubmit = async (formData: Record<string, unknown>) => {
    try {
      // mode is implicitly "add"—no branching
      const { name, description } = formData as {
        name?: string;
        description?: string | null;
      };

      if (!demonstrationId || !name) {
        throw new Error("Demonstration ID and name are required to create an extension.");
      }

      const input: CreateExtensionInput = {
        demonstrationId,
        name,
        description: (description?.length ?? 0) === 0 ? null : description ?? null,
      };

      const { data } = await createExtensionTrigger({ variables: { input } });
      const success = data?.createExtension?.success ?? false;

      if (!success) {
        console.error(data?.createExtension?.message);
        showError("Create extension failed — check the console for details.");
        return;
      }

      onClose();
    } catch (error) {
      console.error(error);
      showError(ERROR_MESSAGE);
    }
  };

  return (
    <BaseModificationDialog
      isOpen={isOpen}
      onClose={onClose}
      mode="add"
      entityId={undefined}
      demonstrationId={demonstrationId}
      data={data}
      entityType="extension"
      onSubmit={onSubmit}
      getFormData={(base) => base}
    />
  );
};
