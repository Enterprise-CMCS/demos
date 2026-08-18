import React from "react";
import { ApplicationWorkflowDocument } from "components/application";
import { useDialog } from "components/dialog/DialogContext";
import { DocumentChip } from "components/document/documentChip";
import { getCurrentUser, isReadonly } from "components/user/UserContext";

export const DocumentList = ({
  documents,
  emptyMessage = "No documents yet.",
}: {
  documents: ApplicationWorkflowDocument[];
  emptyMessage?: string;
}) => {
  const { showRemoveDocumentDialog } = useDialog();
  const { currentUser } = getCurrentUser();
  const isReadonlyUser = isReadonly(currentUser);

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
          isReadonly={isReadonlyUser}
        />
      ))}
    </div>
  );
};
