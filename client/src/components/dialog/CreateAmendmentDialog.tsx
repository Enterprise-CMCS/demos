// components/modifications/CreateAmendmentDialog.tsx
import React from "react";
import { useToast } from "components/toast";
import { useMutation } from "@apollo/client";
import { gql } from "@apollo/client";
import { CreateAmendmentInput, CreateAmendmentPayload } from "demos-server";
import { BaseModificationDialog, BaseModificationDialogProps } from "./BaseModificationDialog";

type Props = Pick<
  BaseModificationDialogProps,
  "isOpen" | "onClose" | "mode" | "demonstrationId" | "data"
> & {
  amendmentId?: string; // not used in create, but keeps prop parity
};

export const CREATE_AMENDMENT_MUTATION = gql`
  mutation CreateAmendment($input: CreateAmendmentInput!) {
    createAmendment(input: $input) {
      success
      message
      amendment {
        id
      }
    }
  }
`;

const SUCCESS_MESSAGE = "Amendment created successfully!";
const ERROR_MESSAGE = "Failed to create amendment. Please try again.";

export const CreateAmendmentDialog: React.FC<Props> = ({
  isOpen = true,
  onClose,
  mode,
  demonstrationId,
  data,
}) => {
  const { showSuccess, showError } = useToast();

  const [createAmendmentTrigger, { loading }] = useMutation<{
    createAmendment: Pick<CreateAmendmentPayload, "success" | "message" | "amendment">;
  }>(CREATE_AMENDMENT_MUTATION);

  const onSubmit = async (formData: Record<string, unknown>) => {
    try {
      if (mode !== "add") {
        // Match the CreateDemonstrationDialog UX; you could also just ignore mode and always create here.
        throw new Error(`CreateAmendmentDialog expects mode="add", received "${mode}"`);
      }

      const { name, description } = formData as {
        name?: string;
        description?: string | null;
      };

      if (!demonstrationId || !name) {
        throw new Error("Demonstration ID and name are required to create an amendment.");
      }

      const input: CreateAmendmentInput = {
        demonstrationId,
        name,
        description: (description?.length ?? 0) === 0 ? null : description ?? null,
      };

      const result = await createAmendmentTrigger({
        variables: { input },
        // add cache updates or refetches if needed:
        // refetchQueries: [{ query: GET_ALL_AMENDMENTS_QUERY, variables: { demonstrationId } }],
        // awaitRefetchQueries: true,
      });

      const success = result.data?.createAmendment?.success ?? false;

      onClose();
      if (success) {
        // showSuccess(SUCCESS_MESSAGE);
      } else {
        // surface message if present
        console.error(result.data?.createAmendment?.message);
        showError("Create amendment failed — check the console for details.");
      }
    } catch (e) {
      console.error(e);
      showError(ERROR_MESSAGE);
    }
  };

  // Leverage your existing base dialog (same pattern as demo dialog wrapper)
  return (
    <BaseModificationDialog
      isOpen={isOpen}
      onClose={onClose}
      mode="add"
      entityId={undefined}
      demonstrationId={demonstrationId}
      data={data}
      entityType="amendment"
      onSubmit={onSubmit}
      getFormData={(base) => base} // keep simple; or reuse createFormDataWithDates if you add dates later
      submitting={loading}
    />
  );
};
