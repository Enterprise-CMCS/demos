import React from "react";
import { DeleteIcon } from "components/icons";
import { tw } from "tags/tw";
import { formatDate } from "util/formatDate";
import { ApplicationWorkflowDocument } from "components/application/ApplicationWorkflow";

const STYLES = {
  list: tw`mt-4 space-y-3`,
  fileRow: tw`bg-surface-secondary border border-border-fields px-3 py-2 flex items-center justify-between`,
  fileMeta: tw`text-xs text-text-placeholder mt-0.5`,
};

export interface DocumentListProps {
  documents: ApplicationWorkflowDocument[];
  onDelete?: (id: string) => void;
  showDescription?: boolean;
  emptyMessage?: string;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onDelete,
  showDescription = true,
  emptyMessage = "No documents yet.",
}) => {
  return (
    <div className={STYLES.list}>
      {documents.length === 0 && (
        <div className="text-sm text-text-placeholder">{emptyMessage}</div>
      )}

      {documents.map((doc) => (
        <div key={doc.id} className={STYLES.fileRow}>
          <div>
            <div className="font-medium">{doc.name}</div>
            <div className={STYLES.fileMeta}>
              {doc.createdAt ? formatDate(doc.createdAt) : "--/--/----"}
              {showDescription && doc.description ? ` • ${doc.description}` : ""}
            </div>
          </div>

          {onDelete && (
            <button
              className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
              onClick={() => onDelete(doc.id)}
              aria-label={`Delete ${doc.name}`}
              title={`Delete ${doc.name}`}
            >
              <DeleteIcon className="w-2 h-2" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
