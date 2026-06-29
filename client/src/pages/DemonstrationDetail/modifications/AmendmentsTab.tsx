import React from "react";
import { IconButton } from "components/button";
import { AddNewIcon } from "components/icons";
import { useDialog } from "components/dialog/DialogContext";
import { DemonstrationDetailModification } from "pages/DemonstrationDetail/DemonstrationDetail";
import { ModificationTabs } from "./ModificationTabs";

const EMPTY_AMENDMENTS_MESSAGE = "No amendments have been added yet";

export const AmendmentsTab: React.FC<{
  demonstrationId: string;
  medicaidId: string;
  amendments: DemonstrationDetailModification[];
  selectedAmendmentId?: string;
  canCreateModifications: boolean;
}> = ({ demonstrationId, medicaidId, amendments, selectedAmendmentId, canCreateModifications }) => {
  const { showCreateAmendmentDialog } = useDialog();

  if (amendments.length === 0) {
    return (
      <div className="flex min-h-70 flex-col items-center justify-center gap-4 p-2">
        <p className="text-sm text-text-primary">{EMPTY_AMENDMENTS_MESSAGE}</p>
        <IconButton
          ariaLabel="Create Amendment"
          icon={<AddNewIcon />}
          name="create-new-amendment"
          size="small"
          disabled={!canCreateModifications}
          onClick={() => showCreateAmendmentDialog(demonstrationId)}
        >
          Create Amendment
        </IconButton>
      </div>
    );
  }

  const amendmentsWithType = amendments.map((amendment) => ({
    ...amendment,
    modificationType: "amendment" as const,
    medicaidId: medicaidId,
  }));

  return (
    <div className="flex flex-col p-2 gap-2">
      <div className="flex justify-between items-center pb-1 border-b border-border-rules">
        <h1 className="text-xl font-bold text-brand uppercase">Amendments</h1>
        <IconButton
          icon={<AddNewIcon />}
          name="add-new-amendment"
          size="small"
          disabled={!canCreateModifications}
          onClick={() => showCreateAmendmentDialog(demonstrationId)}
        >
          Add Amendment
        </IconButton>
      </div>
      <ModificationTabs items={amendmentsWithType} selectedItemId={selectedAmendmentId} />
    </div>
  );
};
