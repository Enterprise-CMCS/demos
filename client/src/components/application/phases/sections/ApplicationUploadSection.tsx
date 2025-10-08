import React from "react";
import { SecondaryButton } from "components/button";
import { ExportIcon, DeleteIcon } from "components/icons";
import { DocumentTableDocument } from "components/table/tables/DocumentTable";
import { formatDate } from "util/formatDate";
import { tw } from "tags/tw";

const STYLES = {
  title: tw`text-xl font-semibold mb-2`,
  helper: tw`text-sm text-text-placeholder mb-2`,
  list: tw`mt-4 space-y-3`,
  fileRow: tw`bg-surface-secondary border border-border-fields px-3 py-2 flex items-center justify-between`,
  fileMeta: tw`text-xs text-text-placeholder mt-0.5`,
};

type Props = {
  title: string;
  helperText: string;
  documents: DocumentTableDocument[];
  onUploadClick: () => void;
  onDeleteDocument: (docId: string) => void;
};

export const ApplicationUploadSection: React.FC<Props> = ({
  title,
  helperText,
  documents,
  onUploadClick,
  onDeleteDocument,
}) => {
  return (
    <div aria-labelledby="upload-title">
      <h4 id="upload-title" className={STYLES.title}>
        {title}
      </h4>
      <p className={STYLES.helper}>{helperText}</p>

      <SecondaryButton onClick={onUploadClick} size="small" name="button-open-upload-modal">
        <span className="flex items-center gap-1">
          Upload
          <ExportIcon />
        </span>
      </SecondaryButton>

      <div className={STYLES.list}>
        {documents.length === 0 && (
          <div className="text-sm text-text-placeholder">No documents yet.</div>
        )}
        {documents.map((doc) => (
          <div key={doc.id} className={STYLES.fileRow}>
            <div>
              <div className="font-medium">{doc.name}</div>
              <div className={STYLES.fileMeta}>
                {doc.createdAt ? formatDate(doc.createdAt) : "--/--/----"}
                {doc.description ? ` • ${doc.description}` : ""}
              </div>
            </div>
            <button
              className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
              onClick={() => onDeleteDocument(doc.id)}
              aria-label={`Delete ${doc.name}`}
              title={`Delete ${doc.name}`}
            >
              <DeleteIcon className="w-2 h-2" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
