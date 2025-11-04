import React from "react";

import { AddDocumentDialog } from "components/dialog/document/DocumentDialog";
import { DocumentType } from "demos-server";

const DOCUMENT_TYPE_SUBSET: DocumentType[] = ["Pre-Submission", "General File"];

type Props = {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  onDocumentUploadSucceeded: () => void;
};

export const ConceptPreSubmissionUploadDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  applicationId,
  onDocumentUploadSucceeded,
}) => {
  return (
    <AddDocumentDialog
      applicationId={applicationId}
      isOpen={isOpen}
      onClose={onClose}
      documentTypeSubset={DOCUMENT_TYPE_SUBSET}
      titleOverride="Pre-Submission Document"
      onDocumentUploadSucceeded={onDocumentUploadSucceeded}
    />
  );
};
