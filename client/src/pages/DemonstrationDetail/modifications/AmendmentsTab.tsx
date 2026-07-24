import React from "react";
import { useQuery } from "@apollo/client";
import { IconButton } from "components/button";
import { AddNewIcon } from "components/icons";
import { useDialog } from "components/dialog/DialogContext";
import type { Amendment } from "demos-server";
import { ModificationTabs } from "./ModificationTabs";
import { DEMONSTRATION_AMENDMENTS_QUERY } from "./modificationQueries";

const EMPTY_AMENDMENTS_MESSAGE = "No amendments have been added yet";

type AmendmentListItem = Pick<Amendment, "id" | "name" | "createdAt">;

export const AmendmentsTab: React.FC<{
  demonstrationId: string;
  medicaidId: string;
  selectedAmendmentId?: string;
  canCreateModifications: boolean;
}> = ({ demonstrationId, medicaidId, selectedAmendmentId, canCreateModifications }) => {
  const { showCreateAmendmentDialog } = useDialog();
  const { data, loading, error } = useQuery<{
    demonstration: { amendments: AmendmentListItem[] };
  }>(DEMONSTRATION_AMENDMENTS_QUERY, {
    variables: { id: demonstrationId },
  });
  const amendments = data?.demonstration.amendments ?? [];

  if (loading) {
    return <div className="p-4">Loading amendments...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error loading amendments.</div>;
  }

  if (amendments.length === 0) {
    return (
      <div className="flex min-h-70 flex-col items-center justify-center gap-4 p-2">
        <p className="text-sm text-text-primary">{EMPTY_AMENDMENTS_MESSAGE}</p>
        <IconButton
          aria-label="Create Amendment"
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
