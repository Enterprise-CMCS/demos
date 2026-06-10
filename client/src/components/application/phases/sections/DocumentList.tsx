import React from "react";
import { tw } from "tags/tw";
import { ApplicationWorkflowDocument } from "components/application";
import { useDialog } from "components/dialog/DialogContext";
import { DocumentChip } from "components/document/documentChip";

const STYLES = {
  list: tw`mt-4 space-y-2`,
  fileRow: tw`bg-surface-secondary border border-border-fields py-2 px-2 flex items-center justify-between`,
  fileMeta: tw`text-xs text-text-placeholder mt-0.5`,
};

export interface DocumentListProps {
  documents: ApplicationWorkflowDocument[];
  showDescription?: boolean;
  emptyMessage?: string;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  emptyMessage = "No documents yet.",
}) => {
  const { showRemoveDocumentDialog } = useDialog();

  return (
    <div className={STYLES.list}>
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
