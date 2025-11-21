import React from "react";

import { AddDocumentDialog } from "components/dialog/document";
import { DocumentType } from "demos-server";

const DOCUMENT_TYPE_SUBSET: DocumentType[] = ["Pre-Submission", "General File"];

type Props = {
  onClose: () => void;
  applicationId: string;
  onDocumentUploadSucceeded: () => void;
};

export const ConceptPreSubmissionUploadDialog: React.FC<Props> = ({
  onClose,
  applicationId,
  onDocumentUploadSucceeded,
}) => {
  return (
    <AddDocumentDialog
      applicationId={applicationId}
      onClose={onClose}
      documentTypeSubset={DOCUMENT_TYPE_SUBSET}
      titleOverride="Pre-Submission Document"
      onDocumentUploadSucceeded={onDocumentUploadSucceeded}
    />
  );
};
