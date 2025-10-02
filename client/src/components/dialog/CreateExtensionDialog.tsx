import React from "react";
import { useToast } from "components/toast";
import { gql, useMutation } from "@apollo/client";
import { CreateExtensionInput, CreateExtensionPayload } from "demos-server";
import { BaseModificationDialog, BaseModificationDialogProps } from "./BaseModificationDialog";

type Props = Pick<BaseModificationDialogProps,
"isOpen" | "onClose" | "mode" | "demonstrationId" | "data">
& {
  extensionId?: string;
};

const ERROR_MESSAGE = "Failed to create extension. Please try again.";

export const CREATE_EXTENSION_MUTATION = gql`
  mutation CreateExtension($input: CreateExtensionInput!) {
    createExtension(input: $input) {
      success
      message
      extension {
        id
      }
    }
  }
`;


export const CreateExtensionDialog: React.FC<Props> = ({
  isOpen = true,
  onClose,
  mode,
  demonstrationId,
  data,
}) => {
  const { showError } = useToast();

  const [createExtensionTrigger] = useMutation<{
    createExtension: Pick<CreateExtensionPayload, "success" | "message" | "extension">}>
    (CREATE_EXTENSION_MUTATION);

  const onSubmit = async (formData: Record<string, unknown>) => {
    try {
      if (mode !== "add") {
        throw new Error(`CreateExtensionDialog expects mode="add", received "${mode}"`);
      }

      const { name, description } = formData as {
        name?: string;
        description?: string | null
      };

      if (!demonstrationId || !name) {
        throw new Error("Demonstration ID and name are required to create an extension.");
      }

      const input: CreateExtensionInput = {
        demonstrationId,
        name,
        description: (description?.length ?? 0) === 0 ? null : description ?? null,
      };

      const result = await createExtensionTrigger({
        variables: { input },
      });

      const success = result.data?.createExtension?.success ?? false;

      if (!success) {
        console.error(result.data?.createExtension?.message);
        showError("Create extension failed — check the console for details.");
      } else {
        onClose();
      }
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
