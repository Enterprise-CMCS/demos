import React, { useEffect, useMemo } from "react";
import { BaseDialog } from "../BaseDialog";
import { useDialog } from "../DialogContext";
import { DemonstrationTypesList } from "./DemonstrationTypesList";
import { AddDemonstrationTypesForm } from "./AddDemonstrationTypesForm";
import { useToast } from "components/toast";
import { Button } from "components/button";

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
  const [demonstrationTypes, setDemonstrationTypes] = React.useState<DemonstrationType[]>();
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
    if (!initialDemonstrationTypes || !demonstrationTypes) return false;
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

  const addDemonstrationType = (demonstrationType: DemonstrationType) => {
    setDemonstrationTypes((prev) => [...(prev || []), demonstrationType]);
  };

  const removeDemonstrationType = (tag: string) => {
    setDemonstrationTypes((prev) => (prev || []).filter((type) => type.tag !== tag));
  };

  return (
    <BaseDialog
      title="Apply Type(s)"
      onClose={closeDialog}
      dialogHasChanges={hasChanges()}
      actionButton={
        <Button
          name={"button-submit-demonstration-dialog"}
          disabled={!hasChanges()}
          onClick={handleSubmit}
        >
          Apply Type(s)
        </Button>
      }
    >
      <>
        <h1>DemonstrationId: {demonstrationId}</h1>
        <div className="flex flex-col gap-2">
          <AddDemonstrationTypesForm
            existingTags={(demonstrationTypes || []).map((type) => type.tag)}
            addDemonstrationType={addDemonstrationType}
          />
          {loading && <p>loading...</p>}
          {error && <p>Error: {error}</p>}
          <DemonstrationTypesList
            demonstrationTypes={demonstrationTypes || []}
            removeDemonstrationType={removeDemonstrationType}
          />
        </div>
      </>
    </BaseDialog>
  );
};
