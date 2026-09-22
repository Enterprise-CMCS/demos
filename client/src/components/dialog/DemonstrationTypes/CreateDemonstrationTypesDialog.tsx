import React, { useState } from "react";
import { BaseDialog } from "../BaseDialog";
import { useDialog } from "../DialogContext";
import { CreateDemonstrationTypesList } from "./CreateDemonstrationTypesList";
import { CreateDemonstrationTypesForm } from "./CreateDemonstrationTypesForm";
import { Button } from "components/button";
import { TagName, TagStatus } from "demos-server";

export type NewDemonstrationType = {
  demonstrationTypeName: TagName;
  approvalStatus: TagStatus;
};

export const CreateDemonstrationTypesDialog = () => {
  const { closeDialog } = useDialog();

  const [demonstrationTypes, setDemonstrationTypes] = useState<
    NewDemonstrationType[]
  >([]);

  const handleSave = () => {
    // Integration story will add mutation here.
  };

  return (
    <BaseDialog
      title="Create New Tag/Type(s)"
      onClose={closeDialog}
      dialogHasChanges={demonstrationTypes.length > 0}
      maxWidthClass="max-w-[920px]"
      actionButton={
        <Button
          name="button-save-demonstration-types"
          disabled={!demonstrationTypes.length}
          onClick={handleSave}
        >
          Save
        </Button>
      }
    >
      <div className="flex flex-col gap-2">
        <CreateDemonstrationTypesForm
          demonstrationTypeNames={demonstrationTypes.map(
            (type) => type.demonstrationTypeName
          )}
          addDemonstrationType={(demonstrationType) =>
            setDemonstrationTypes((prev) => [...prev, demonstrationType])
          }
        />

        <CreateDemonstrationTypesList
          demonstrationTypes={demonstrationTypes}
          removeDemonstrationType={(demonstrationTypeName) =>
            setDemonstrationTypes((prev) =>
              prev.filter(
                (demonstrationType) =>
                  demonstrationType.demonstrationTypeName !==
                  demonstrationTypeName
              )
            )
          }
        />
      </div>
    </BaseDialog>
  );
};
