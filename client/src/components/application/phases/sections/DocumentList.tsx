import React from "react";
import { ApplicationWorkflowDocument } from "components/application";
import { useDialog } from "components/dialog/DialogContext";
import { DocumentChip } from "components/document/documentChip";

export const DocumentList = ({
  documents,
  emptyMessage = "No documents yet.",
}: {
  documents: ApplicationWorkflowDocument[];
  emptyMessage?: string;
}) => {
  const { showRemoveDocumentDialog } = useDialog();

  return (
    <div className="mt-2 space-y-2">
      {documents.length === 0 && (
        <div className="text-sm text-text-placeholder">{emptyMessage}</div>
      )}

      {documents.map((doc) => (
        <DocumentChip
          document={doc}
          key={doc.id}
          onRemove={() => showRemoveDocumentDialog([doc.id])}
        />
      ))}
    </div>
  );
};
