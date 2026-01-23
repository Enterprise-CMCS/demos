import React, { useEffect } from "react";
import { BaseDialog } from "../BaseDialog";
import { useDialog } from "../DialogContext";
import { DemonstrationTypesList } from "./DemonstrationTypesList";
import { AddDemonstrationTypesForm } from "./AddDemonstrationTypesForm";
import { useToast } from "components/toast";
import { Button } from "components/button";
import { gql, TypedDocumentNode, useQuery } from "@apollo/client";
import { Demonstration as ServerDemonstration, Tag as DemonstrationTypeName } from "demos-server";

// TODO: replace this with server type with updated DemonstrationTypeName field when available
export type DemonstrationType = {
  demonstrationTypeName: DemonstrationTypeName;
  effectiveDate: string;
  expirationDate: string;
};
export type Demonstration = Pick<ServerDemonstration, "id"> & {
  demonstrationTypes: DemonstrationType[];
};

export const ASSIGN_DEMONSTRATION_TYPES_DIALOG_QUERY: TypedDocumentNode<
  { demonstration: Demonstration },
  { id: string }
> = gql`
  query AssignDemonstrationTypesDialog($id: ID!) {
    demonstration(id: $id) {
      id
      demonstrationTypes {
        demonstrationTypeName
        effectiveDate
        expirationDate
      }
    }
  }
`;

const hasChanges = (
  initialDemonstrationTypes?: DemonstrationType[],
  currentDemonstrationTypes?: DemonstrationType[]
) => {
  if (!initialDemonstrationTypes || !currentDemonstrationTypes) return false;
  if (initialDemonstrationTypes.length !== currentDemonstrationTypes.length) return true;

  return currentDemonstrationTypes.some(
    (currentDemonstrationType) =>
      !initialDemonstrationTypes.some(
        (initialDemonstrationType) =>
          initialDemonstrationType.demonstrationTypeName ===
            currentDemonstrationType.demonstrationTypeName &&
          initialDemonstrationType.effectiveDate === currentDemonstrationType.effectiveDate &&
          initialDemonstrationType.expirationDate === currentDemonstrationType.expirationDate
      )
  );
};

export const ApplyDemonstrationTypesDialog = ({ demonstrationId }: { demonstrationId: string }) => {
  const { closeDialog } = useDialog();
  const { showSuccess } = useToast();
  const { data, loading, error } = useQuery(ASSIGN_DEMONSTRATION_TYPES_DIALOG_QUERY, {
    variables: { id: demonstrationId },
  });

  const initialDemonstrationTypes = data?.demonstration.demonstrationTypes;
  const [demonstrationTypes, setDemonstrationTypes] = React.useState(initialDemonstrationTypes);

  useEffect(() => {
    if (initialDemonstrationTypes) {
      setDemonstrationTypes(initialDemonstrationTypes);
    }
  }, [initialDemonstrationTypes]);

  const handleSubmit = () => {
    console.log("Submitting demonstration types", demonstrationTypes);
    showSuccess("Demonstration types applied successfully.");
    closeDialog();
  };

  return (
    <BaseDialog
      title="Apply Type(s)"
      onClose={closeDialog}
      dialogHasChanges={hasChanges(initialDemonstrationTypes, demonstrationTypes)}
      actionButton={
        <Button
          name={"button-submit-demonstration-dialog"}
          disabled={!hasChanges(initialDemonstrationTypes, demonstrationTypes)}
          onClick={handleSubmit}
        >
          Apply Type(s)
        </Button>
      }
    >
      <>
        {loading && <p>Loading...</p>}
        {error && <p>Error loading demonstration data.</p>}
        {demonstrationTypes && (
          <div className="flex flex-col gap-2">
            <AddDemonstrationTypesForm
              demonstrationTypes={demonstrationTypes}
              addDemonstrationType={(demonstrationType: DemonstrationType) =>
                setDemonstrationTypes([...demonstrationTypes, demonstrationType])
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
        )}
      </>
    </BaseDialog>
  );
};
