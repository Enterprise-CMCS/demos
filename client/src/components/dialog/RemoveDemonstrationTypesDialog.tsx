import React from "react";
import { BaseDialog } from "./BaseDialog";
import { useDialog } from "./DialogContext";
import { useToast } from "components/toast";
import { ErrorButton } from "components/button";
import {
  DemonstrationTypeAssignment,
  Tag as DemonstrationTypeName,
  SetDemonstrationTypesInput,
  Demonstration as ServerDemonstration,
} from "demos-server";
import { ErrorIcon } from "components/icons";
import { gql, TypedDocumentNode, useMutation } from "@apollo/client";

type Demonstration = Pick<ServerDemonstration, "id"> & {
  demonstrationTypes: Pick<DemonstrationTypeAssignment, "demonstrationTypeName">[];
};

export const REMOVE_DEMONSTRATION_TYPES_DIALOG_MUTATION: TypedDocumentNode<
  { setDemonstrationTypes: Demonstration },
  { input: SetDemonstrationTypesInput }
> = gql`
  mutation setDemonstrationTypes($input: SetDemonstrationTypesInput!) {
    setDemonstrationTypes(input: $input) {
      id
      demonstrationTypes {
        demonstrationTypeName
      }
    }
  }
`;

export const RemoveDemonstrationTypesDialog = ({
  demonstrationId,
  demonstrationTypeNames,
}: {
  demonstrationId: string;
  demonstrationTypeNames: DemonstrationTypeName[];
}) => {
  const { closeDialog } = useDialog();
  const { showSuccess, showError } = useToast();

  const [removeDemonstrationTypes, { loading: removing }] = useMutation(
    REMOVE_DEMONSTRATION_TYPES_DIALOG_MUTATION
  );

  const onConfirm = async () => {
    const setDemonstrationTypeInput = {
      demonstrationId,
      demonstrationTypes: demonstrationTypeNames.map((demonstrationTypeName) => ({
        demonstrationTypeName,
        demonstrationTypeDates: null,
      })),
    };
    try {
      await removeDemonstrationTypes({
        variables: { input: setDemonstrationTypeInput },
      });
      showSuccess("Demonstration type(s) removed successfully.");
    } catch (error) {
      console.error("Error removing demonstration types:", error);
      showError("Failed to remove demonstration types.");
    }
    closeDialog();
  };

  return (
    <BaseDialog
      title="Remove Type(s)"
      onClose={closeDialog}
      dialogHasChanges={false}
      actionButton={
        <ErrorButton
          name="button-confirm-remove-types"
          size="small"
          onClick={onConfirm}
          aria-label="Confirm Remove Document"
          disabled={removing}
          aria-disabled={removing}
        >
          {removing ? "Removing..." : "Remove"}
        </ErrorButton>
      }
    >
      <div className="mb-2 text-sm text-text-filled">
        Are you sure you want to remove{" "}
        {demonstrationTypeNames.length > 1 ? `${demonstrationTypeNames.length} Types` : "this Type"}{" "}
        from the demonstration?
        <br />
        <span className="text-error flex items-center gap-1 mt-1">
          <ErrorIcon />
          This action cannot be undone!
        </span>
      </div>
    </BaseDialog>
  );
};
