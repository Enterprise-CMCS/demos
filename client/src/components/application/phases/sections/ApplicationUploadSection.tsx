import React from "react";
import { SecondaryButton } from "components/button";
import { ExportIcon } from "components/icons";
import { tw } from "tags/tw";
import { DocumentList } from "./DocumentList";
import { ApplicationWorkflowDocument } from "components/application";
import { getCurrentUser, isReadonly } from "components/user/UserContext";

const STYLES = {
  title: tw`text-xl font-semibold mb-2`,
  helper: tw`text-sm text-text-placeholder mb-2`,
  list: tw`mt-4 space-y-3`,
};

export const ApplicationUploadSection = ({
  title,
  helperText,
  documents,
  onUploadClick,
  hideUploadButton = false,
  documentsReadonly: documentsAreReadonly = false,
}: {
  title: string;
  helperText: string;
  documents: ApplicationWorkflowDocument[];
  onUploadClick: () => void;
  hideUploadButton?: boolean;
  documentsReadonly?: boolean;
}) => {
  const { currentUser } = getCurrentUser();
  const hideButton = hideUploadButton || isReadonly(currentUser, "ApplicationWorkflow");
  const docsReadonly = documentsAreReadonly || isReadonly(currentUser, "ApplicationWorkflow");

  return (
    <div aria-labelledby="upload-title">
      <h4 id="upload-title" className={STYLES.title}>
        {title}
      </h4>
      <p className={STYLES.helper}>{helperText}</p>

      <SecondaryButton
        isHidden={hideButton}
        onClick={onUploadClick}
        size="small"
        name="button-open-upload-modal"
        aria-label="Upload"
      >
        Upload
        <ExportIcon />
      </SecondaryButton>

      <DocumentList documents={documents} isReadonly={docsReadonly} />
    </div>
  );
};
