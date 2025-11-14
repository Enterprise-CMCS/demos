import { IconButton } from "components/button";
import { useDialog } from "components/dialog/DialogContext";
import { AddNewIcon } from "components/icons";
import { DocumentTable } from "components/table/tables/DocumentTable";
import React from "react";

export const DocumentsTab: React.FC<{ demonstrationId: string }> = ({ demonstrationId }) => {
  const { showUploadDocumentDialog } = useDialog();

  return (
    <>
      <div className="flex justify-between items-center pb-1 mb-2 border-b border-brand">
        <h1 className="text-xl font-bold text-brand uppercase">Documents</h1>
        <IconButton
          icon={<AddNewIcon />}
          name="add-new-document"
          size="small"
          onClick={() => showUploadDocumentDialog(demonstrationId)}
        >
          Add Document
        </IconButton>
      </div>
      <DocumentTable applicationId={demonstrationId} />
    </>
  );
};
