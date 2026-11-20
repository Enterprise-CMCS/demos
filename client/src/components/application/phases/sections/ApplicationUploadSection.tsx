import React from "react";
import { SecondaryButton } from "components/button";
import { ExportIcon } from "components/icons";
import { DocumentList } from "./DocumentList";
import { ApplicationWorkflowDocument } from "components/application";
import { getCurrentUser, isReadonly } from "components/user/UserContext";

export const ApplicationUploadSection = ({
  title,
  helperText,
  documents,
  onUploadClick,
  hideUploadButton = false,
  documentsAreReadonly = false,
}: {
  title: string;
  helperText: string;
  documents: ApplicationWorkflowDocument[];
  onUploadClick: () => void;
  hideUploadButton?: boolean;
  documentsAreReadonly?: boolean;
}) => {
  const { currentUser } = getCurrentUser();
  const hideButton = hideUploadButton || isReadonly(currentUser, "ApplicationWorkflow");
  const docsReadonly = documentsAreReadonly || isReadonly(currentUser, "ApplicationWorkflow");

  return (
    <div aria-labelledby="upload-title">
      <h4 id="upload-title" className="text-xl text-text-font font-semibold mb-2">
        {title}
      </h4>
      <p className="text-sm text-text-placeholder mb-2">{helperText}</p>

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
