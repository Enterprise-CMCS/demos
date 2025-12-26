import React from "react";
import { SecondaryButton } from "components/button";
import { ExportIcon } from "components/icons";
import { tw } from "tags/tw";
import { DocumentList } from "./DocumentList";
import { ApplicationWorkflowDocument } from "components/application/ApplicationWorkflow";

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
  documents: ApplicationWorkflowDocument[];
  onUploadClick: () => void;
};

export const ApplicationUploadSection: React.FC<Props> = ({
  title,
  helperText,
  documents,
  onUploadClick,
}) => {
  return (
    <div aria-labelledby="upload-title">
      <h4 id="upload-title" className={STYLES.title}>
        {title}
      </h4>
      <p className={STYLES.helper}>{helperText}</p>

      <SecondaryButton onClick={onUploadClick} size="small" name="button-open-upload-modal">
        Upload
        <ExportIcon />
      </SecondaryButton>

      <DocumentList documents={documents} />
    </div>
  );
};
