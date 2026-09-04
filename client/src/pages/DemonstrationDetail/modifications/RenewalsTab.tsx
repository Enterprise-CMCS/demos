import React from "react";
import { IconButton } from "components/button";
import { AddNewIcon } from "components/icons";
import { useDialog } from "components/dialog/DialogContext";
import { DemonstrationDetailModification } from "pages/DemonstrationDetail/DemonstrationDetail";
import { ModificationTabs } from "./ModificationTabs";
import { getCurrentUser, isReadonly } from "components/user/UserContext";

const EMPTY_RENEWALS_MESSAGE = "No renewals have been added yet";

export const RenewalsTab: React.FC<{
  demonstrationId: string;
  medicaidId: string;
  renewals: DemonstrationDetailModification[];
  selectedRenewalId?: string;
  canCreateModifications: boolean;
}> = ({ demonstrationId, medicaidId, renewals, selectedRenewalId, canCreateModifications }) => {
  const { currentUser } = getCurrentUser();
  const isReadonlyUser = isReadonly(currentUser);

  const { showCreateRenewalDialog } = useDialog();

  if (renewals.length === 0) {
    return (
      <div className="flex min-h-90 flex-col items-center justify-center gap-4 p-2">
        <p className="text-sm text-text-primary">{EMPTY_RENEWALS_MESSAGE}</p>
        {!isReadonlyUser && (
          <IconButton
            aria-label="Create Renewal"
            icon={<AddNewIcon />}
            name="create-new-renewal"
            size="small"
            disabled={!canCreateModifications}
            onClick={() => showCreateRenewalDialog(demonstrationId)}
          >
            Create Renewal
          </IconButton>
        )}
      </div>
    );
  }

  const renewalsWithType = renewals.map((renewal) => ({
    ...renewal,
    modificationType: "renewal" as const,
    medicaidId: medicaidId,
  }));

  return (
    <div className="flex flex-col p-2 gap-2">
      <div className="flex justify-between items-center pb-1 border-b border-border-rules">
        <h1 className="text-xl font-bold text-brand uppercase">Renewals</h1>
        {!isReadonlyUser && (
          <IconButton
            icon={<AddNewIcon />}
            name="add-new-renewal"
            size="small"
            disabled={!canCreateModifications}
            onClick={() => showCreateRenewalDialog(demonstrationId)}
          >
            Add Renewal
          </IconButton>
        )}
      </div>
      <ModificationTabs items={renewalsWithType} selectedItemId={selectedRenewalId} />
    </div>
  );
};
