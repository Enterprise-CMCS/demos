import React, { useEffect } from "react";
import { BaseDialog } from "../BaseDialog";
import { useDialog } from "../DialogContext";
import { DemonstrationTypesList } from "./DemonstrationTypesList";
import { AddDemonstrationTypesForm } from "./AddDemonstrationTypesForm";
import { useToast } from "components/toast";
import { Button } from "components/button";
import {
  DemonstrationType,
  useApplyDemonstrationTypesDialogData,
} from "./useApplyDemonstrationTypesDialogData";

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
  const { showSuccess, showError } = useToast();

  const { data, loading, loadingError, save, saving } =
    useApplyDemonstrationTypesDialogData(demonstrationId);

  const initialDemonstrationTypes = data?.demonstration.demonstrationTypes;
  const [demonstrationTypes, setDemonstrationTypes] = React.useState(initialDemonstrationTypes);

  useEffect(() => {
    if (initialDemonstrationTypes) {
      setDemonstrationTypes(initialDemonstrationTypes);
    }
  }, [initialDemonstrationTypes]);

  const handleSubmit = async () => {
    if (!initialDemonstrationTypes || !demonstrationTypes) return;
    try {
      await save(demonstrationId, initialDemonstrationTypes, demonstrationTypes);
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
      dialogHasChanges={hasChanges(initialDemonstrationTypes, demonstrationTypes)}
      maxWidthClass="max-w-[920px]"
      actionButton={
        <Button
          name={"button-submit-demonstration-dialog"}
          disabled={loading || saving || !hasChanges(initialDemonstrationTypes, demonstrationTypes)}
          onClick={handleSubmit}
        >
          Apply Type(s)
        </Button>
      }
    >
      <>
        {loading && <p>Loading...</p>}
        {loadingError && <p>Error loading demonstration data.</p>}
        {demonstrationTypes && (
          <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-gray-300">
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
