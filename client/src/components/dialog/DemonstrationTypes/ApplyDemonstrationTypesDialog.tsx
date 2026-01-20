import React, { useEffect } from "react";
import { BaseDialog } from "../BaseDialog";
import { useDialog } from "../DialogContext";
import { DemonstrationTypesList } from "./DemonstrationTypesList";
import { AddDemonstrationTypesForm } from "./AddDemonstrationTypesForm";
import { useToast } from "components/toast";
import { Button } from "components/button";
import { gql, useQuery } from "@apollo/client";
import { Demonstration as ServerDemonstration } from "demos-server";
import { DemonstrationType as MockDemonstrationType } from "mock-data/DemonstrationTypeMocks";
import { Tag } from "mock-data/TagMocks";

export type DemonstrationType = Pick<
  MockDemonstrationType,
  "tag" | "effectiveDate" | "expirationDate"
>;
type Demonstration = Pick<ServerDemonstration, "id"> & {
  demonstrationTypes: DemonstrationType[];
};

export const ASSIGN_DEMONSTRATION_TYPES_DIALOG_QUERY = gql`
  query AssignDemonstraitonTypesDialogQuery($id: ID!) {
    demonstration(id: $id) {
      id
      demonstrationTypes {
        tag
        effectiveDate
        expirationDate
      }
    }
  }
`;

export const ApplyDemonstrationTypesDialog = ({ demonstrationId }: { demonstrationId: string }) => {
  const { data, loading, error } = useQuery<{ demonstration: Demonstration }>(
    ASSIGN_DEMONSTRATION_TYPES_DIALOG_QUERY,
    {
      variables: { id: demonstrationId },
    }
  );
  const initialDemonstrationTypes = data?.demonstration.demonstrationTypes || [];

  const { closeDialog } = useDialog();
  const { showSuccess } = useToast();
  const [demonstrationTypes, setDemonstrationTypes] = React.useState<DemonstrationType[]>([]);

  useEffect(() => {
    if (data?.demonstration.demonstrationTypes) {
      setDemonstrationTypes(data.demonstration.demonstrationTypes);
    }
  }, [data]);

  const handleSubmit = () => {
    console.log("Submitting demonstration types:", demonstrationTypes);
    showSuccess("Demonstration types applied successfully.");
    closeDialog();
  };

  const addDemonstrationType = (demonstrationType: DemonstrationType) => {
    setDemonstrationTypes((demonstrationTypes) => [...demonstrationTypes, demonstrationType]);
  };

  const removeDemonstrationType = (tag: Tag) => {
    setDemonstrationTypes((demonstrationTypes) =>
      demonstrationTypes.filter((demonstrationType) => demonstrationType.tag !== tag)
    );
  };

  const hasChanges = () => {
    if (initialDemonstrationTypes.length !== demonstrationTypes.length) return true;

    return demonstrationTypes.some(
      (currentDemonstrationType) =>
        !initialDemonstrationTypes.some(
          (initialDemonstrationType) =>
            initialDemonstrationType.tag === currentDemonstrationType.tag &&
            initialDemonstrationType.effectiveDate === currentDemonstrationType.effectiveDate &&
            initialDemonstrationType.expirationDate === currentDemonstrationType.expirationDate
        )
    );
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
        {loading && <p>Loading...</p>}
        {error && <p>Error loading demonstration data.</p>}
        {data && (
          <div className="flex flex-col gap-2">
            <AddDemonstrationTypesForm
              selectedTags={demonstrationTypes.map((demonstrationType) => demonstrationType.tag)}
              addDemonstrationType={addDemonstrationType}
            />
            <DemonstrationTypesList
              demonstrationTypes={demonstrationTypes}
              removeDemonstrationType={removeDemonstrationType}
            />
          </div>
        )}
      </>
    </BaseDialog>
  );
};
