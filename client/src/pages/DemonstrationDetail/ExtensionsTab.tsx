import React from "react";
import { IconButton } from "components/button";
import { AddNewIcon } from "components/icons";
import { useDialog } from "components/dialog/DialogContext";
import { DemonstrationDetailExtension } from "./DemonstrationDetail";
import { ModificationTabs } from "./ModificationTabs";

export const ExtensionsTab: React.FC<{
  demonstrationId: string;
  extensions: DemonstrationDetailExtension[];
}> = ({ demonstrationId, extensions }) => {
  const { showCreateExtensionDialog } = useDialog();
  return (
    <div className="p-2">
      <div className="flex justify-between items-center pb-1 mb-4 border-b border-brand">
        <h1 className="text-xl font-bold text-brand uppercase">Extensions</h1>
        <IconButton
          icon={<AddNewIcon />}
          name="add-new-extension"
          size="small"
          onClick={() => showCreateExtensionDialog(demonstrationId)}
        >
          Add Extension
        </IconButton>
      </div>
      <ModificationTabs items={extensions} />
    </div>
  );
};
