import React, { useEffect, useMemo } from "react";
import { BaseDialog } from "../BaseDialog";
import { SubmitButton } from "components/button/SubmitButton";
import { useDialog } from "../DialogContext";
import { DemonstrationTypesList } from "./DemonstrationTypesList";
import { AddDemonstrationTypesForm } from "./AddDemonstrationTypesForm";
import { useToast } from "components/toast";

export type DemonstrationType = {
  tag: string;
  effectiveDate: string;
  expirationDate: string;
};

type Demonstration = {
  id: string;
  demonstrationTypes: DemonstrationType[];
};

const getDemonstrationMock = (demonstrationId: string): Demonstration => ({
  id: demonstrationId,
  demonstrationTypes: [
    {
      tag: "Type A",
      effectiveDate: "2024-01-01",
      expirationDate: "2024-12-31",
    },
    {
      tag: "Type B",
      effectiveDate: "2024-02-01",
      expirationDate: "2024-11-30",
    },
  ],
});

export const ApplyDemonstrationTypesDialog = ({ demonstrationId }: { demonstrationId: string }) => {
  const { closeDialog } = useDialog();
  const { showSuccess } = useToast();
  const [demonstrationTypes, setDemonstrationTypes] = React.useState<DemonstrationType[]>([]);
  // emulate fetching demonstration data
  const { data, loading, error } = useMemo<{
    loading: boolean;
    error?: string;
    data?: { demonstration: Demonstration };
  }>(
    () => ({
      loading: false,
      error: undefined,
      data: { demonstration: getDemonstrationMock(demonstrationId) },
    }),
    [demonstrationId]
  );

  const initialDemonstrationTypes = data?.demonstration.demonstrationTypes;

  useEffect(() => {
    if (initialDemonstrationTypes === undefined) return;
    setDemonstrationTypes(initialDemonstrationTypes);
  }, [initialDemonstrationTypes]);

  const handleSubmit = () => {
    console.log("Submitting demonstration types:", demonstrationTypes);
    showSuccess("Demonstration types applied successfully.");
    closeDialog();
  };

  const hasChanges = () => {
    if (initialDemonstrationTypes === undefined) return false;
    if (initialDemonstrationTypes.length !== demonstrationTypes.length) return true;

    return demonstrationTypes.some(
      (newType) =>
        !initialDemonstrationTypes.some(
          (initialType) =>
            initialType.tag === newType.tag &&
            initialType.effectiveDate === newType.effectiveDate &&
            initialType.expirationDate === newType.expirationDate
        )
    );
  };
  const isSubmitting = false;

  return (
    <BaseDialog
      title="Apply Type(s)"
      onClose={closeDialog}
      dialogHasChanges={hasChanges()}
      actionButton={
        <SubmitButton
          name={"button-submit-demonstration-dialog"}
          disabled={!hasChanges()}
          isSubmitting={isSubmitting}
          onClick={handleSubmit}
        />
      }
    >
      <>
        <h1>DemonstrationId: {demonstrationId}</h1>
        <div className="flex flex-col gap-2">
          <AddDemonstrationTypesForm
            demonstrationTypes={demonstrationTypes}
            addDemonstrationType={(demonstrationType) =>
              setDemonstrationTypes((prev) => [...prev, demonstrationType])
            }
          />
          {loading && <p>loading...</p>}
          {error && <p>Error: {error}</p>}
          <DemonstrationTypesList
            demonstrationTypes={demonstrationTypes}
            setDemonstrationTypes={setDemonstrationTypes}
          />
        </div>
      </>
    </BaseDialog>
  );
};
