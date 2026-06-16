import React from "react";
import { IconButton } from "components/button";
import { AddNewIcon } from "components/icons";
import { useDialog } from "components/dialog/DialogContext";
import { DemonstrationDetailModification } from "pages/DemonstrationDetail/DemonstrationDetail";
import { ModificationTabs } from "./ModificationTabs";

export const AmendmentsTab: React.FC<{
  demonstrationId: string;
  medicaidId: string;
  amendments: DemonstrationDetailModification[];
  selectedAmendmentId?: string;
}> = ({ demonstrationId, medicaidId, amendments, selectedAmendmentId }) => {
  const { showCreateAmendmentDialog } = useDialog();

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
          onClick={() => showCreateAmendmentDialog(demonstrationId)}
        >
          Add Amendment
        </IconButton>
      </div>
      <ModificationTabs items={amendmentsWithType} selectedItemId={selectedAmendmentId} />
    </div>
  );
};
