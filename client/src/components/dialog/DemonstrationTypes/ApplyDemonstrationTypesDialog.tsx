import React from "react";
import { BaseDialog } from "../BaseDialog";
import { useDialog } from "../DialogContext";
import { DemonstrationTypesList } from "./DemonstrationTypesList";
import { AddDemonstrationTypesForm } from "./AddDemonstrationTypesForm";
import { useToast } from "components/toast";
import { Button } from "components/button";
import { Tag as DemonstrationTypeName, LocalDate, SetDemonstrationTypesInput } from "demos-server";
import { gql, TypedDocumentNode, useMutation } from "@apollo/client";

export type DemonstrationType = {
  demonstrationTypeName: DemonstrationTypeName;
  effectiveDate: string;
  expirationDate: string;
};

export const ASSIGN_DEMONSTRATION_TYPES_DIALOG_MUTATION: TypedDocumentNode<
  {
    setDemonstrationTypes: {
      id: string;
      demonstrationTypes: {
        demonstrationTypeName: DemonstrationTypeName;
      };
    };
  },
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

const getSetDemonstrationTypesInput = (
  demonstrationId: string,
  demonstrationTypes: DemonstrationType[]
): SetDemonstrationTypesInput => {
  return {
    demonstrationId,
    demonstrationTypes: demonstrationTypes.map((dt) => ({
      demonstrationTypeName: dt.demonstrationTypeName,
      demonstrationTypeDates: {
        effectiveDate: dt.effectiveDate as LocalDate,
        expirationDate: dt.expirationDate as LocalDate,
      },
    })),
  };
};

export const ApplyDemonstrationTypesDialog = ({ demonstrationId }: { demonstrationId: string }) => {
  const { closeDialog } = useDialog();
  const { showSuccess, showError } = useToast();
  const [mutateDemonstrationTypes, { loading: saving }] = useMutation(
    ASSIGN_DEMONSTRATION_TYPES_DIALOG_MUTATION
  );

  const [demonstrationTypes, setDemonstrationTypes] = React.useState<DemonstrationType[]>([]);

  const handleSubmit = async () => {
    try {
      await mutateDemonstrationTypes({
        variables: {
          input: getSetDemonstrationTypesInput(demonstrationId, demonstrationTypes),
        },
      });
      showSuccess("Demonstration types applied successfully.");
    } catch (error) {
      console.error("Error applying demonstration types:", error);
      showError("Failed to apply demonstration types.");
    }
    closeDialog();
  };

  return (
    <BaseDialog
      title="Apply Type(s)"
      onClose={closeDialog}
      dialogHasChanges={!!demonstrationTypes.length}
      maxWidthClass="max-w-[920px]"
      actionButton={
        <Button
          name={"button-submit-demonstration-dialog"}
          disabled={saving || !demonstrationTypes.length}
          onClick={handleSubmit}
        >
          Apply Type(s)
        </Button>
      }
    >
      <>
        <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-gray-300">
          <AddDemonstrationTypesForm
            demonstrationId={demonstrationId}
            demonstrationTypeNames={demonstrationTypes.map(
              (demonstrationType) => demonstrationType.demonstrationTypeName
            )}
            addDemonstrationType={(demonstrationType: DemonstrationType) =>
              setDemonstrationTypes(() => [...demonstrationTypes, demonstrationType])
            }
          />
          <DemonstrationTypesList
            demonstrationTypes={demonstrationTypes}
            removeDemonstrationType={(demonstrationTypeName: string) =>
              setDemonstrationTypes(
                demonstrationTypes.filter(
                  (demonstrationType) =>
                    demonstrationType.demonstrationTypeName !== demonstrationTypeName
                )
              )
            }
          />
        </div>
      </>
    </BaseDialog>
  );
};
