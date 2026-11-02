import React from "react";
import { ApplicationWorkflowDocument } from "components/application";
import { useDialog } from "components/dialog/DialogContext";
import { DocumentChip } from "components/document/DocumentChip";
import { getCurrentUser, isReadonly } from "components/user/UserContext";

export const DocumentList = ({
  documents,
  emptyMessage = "No documents yet.",
  isReadonly: isReadonlyProp = false,
}: {
  documents: ApplicationWorkflowDocument[];
  emptyMessage?: string;
  isReadonly?: boolean;
}) => {
  const { currentUser } = getCurrentUser();
  const isReadonlyUser = isReadonlyProp || isReadonly(currentUser, "ApplicationWorkflow");
  const { showRemoveApplicationDocumentsDialog } = useDialog();

  return (
    <div className="mt-2 space-y-2">
      {documents.length === 0 && (
        <div className="text-sm text-text-placeholder">{emptyMessage}</div>
      )}

      {documents.map((doc) => (
        <DocumentChip
          document={doc}
          key={doc.id}
          onRemove={() => showRemoveApplicationDocumentsDialog([doc.id])}
          isReadonly={isReadonlyUser}
        />
      ))}
    </div>
  );
};
