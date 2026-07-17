import React from "react";
import { IconButton } from "components/button";
import { AddNewIcon } from "components/icons";
import { useDialog } from "components/dialog/DialogContext";
import { DemonstrationDetailModification } from "pages/DemonstrationDetail/DemonstrationDetail";
import { ModificationTabs } from "./ModificationTabs";

const EMPTY_EXTENSIONS_MESSAGE = "No extensions have been added yet";

export const ExtensionsTab: React.FC<{
  demonstrationId: string;
  medicaidId: string;
  extensions: DemonstrationDetailModification[];
  selectedExtensionId?: string;
  canCreateModifications: boolean;
}> = ({ demonstrationId, medicaidId, extensions, selectedExtensionId, canCreateModifications }) => {
  const { showCreateExtensionDialog } = useDialog();

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
