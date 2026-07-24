import React from "react";
import { useQuery } from "@apollo/client";
import { IconButton } from "components/button";
import { AddNewIcon } from "components/icons";
import { useDialog } from "components/dialog/DialogContext";
import type { Extension } from "demos-server";
import { ModificationTabs } from "./ModificationTabs";
import { DEMONSTRATION_EXTENSIONS_QUERY } from "./modificationQueries";

const EMPTY_EXTENSIONS_MESSAGE = "No extensions have been added yet";

type ExtensionListItem = Pick<Extension, "id" | "name" | "createdAt">;

export const ExtensionsTab: React.FC<{
  demonstrationId: string;
  medicaidId: string;
  selectedExtensionId?: string;
  canCreateModifications: boolean;
}> = ({ demonstrationId, medicaidId, selectedExtensionId, canCreateModifications }) => {
  const { showCreateExtensionDialog } = useDialog();
  const { data, loading, error } = useQuery<{
    demonstration: { extensions: ExtensionListItem[] };
  }>(DEMONSTRATION_EXTENSIONS_QUERY, {
    variables: { id: demonstrationId },
  });
  const extensions = data?.demonstration.extensions ?? [];

  if (loading) {
    return <div className="p-4">Loading extensions...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error loading extensions.</div>;
  }

  if (extensions.length === 0) {
    return (
      <div className="flex min-h-90 flex-col items-center justify-center gap-4 p-2">
        <p className="text-sm text-text-primary">{EMPTY_EXTENSIONS_MESSAGE}</p>
        <IconButton
          aria-label="Create Extension"
          icon={<AddNewIcon />}
          name="create-new-extension"
          size="small"
          disabled={!canCreateModifications}
          onClick={() => showCreateExtensionDialog(demonstrationId)}
        >
          Create Extension
        </IconButton>
      </div>
    );
  }

  const extensionsWithType = extensions.map((extension) => ({
    ...extension,
    modificationType: "extension" as const,
    medicaidId: medicaidId,
  }));

  return (
    <div className="flex flex-col p-2 gap-2">
      <div className="flex justify-between items-center pb-1 border-b border-border-rules">
        <h1 className="text-xl font-bold text-brand uppercase">Extensions</h1>
        <IconButton
          icon={<AddNewIcon />}
          name="add-new-extension"
          size="small"
          disabled={!canCreateModifications}
          onClick={() => showCreateExtensionDialog(demonstrationId)}
        >
          Add Extension
        </IconButton>
      </div>
      <ModificationTabs items={extensionsWithType} selectedItemId={selectedExtensionId} />
    </div>
  );
};
