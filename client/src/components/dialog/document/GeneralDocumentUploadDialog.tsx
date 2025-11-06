import React from "react";

import { AddDocumentDialog } from "components/dialog/document/DocumentDialog";
import { DocumentType } from "demos-server";

const DOCUMENT_TYPE_SUBSET: DocumentType[] = [
  "General File",
];

type Props = {
  applicationId: string;
  isOpen: boolean;
  onClose: () => void;
  onDocumentUploadSucceeded?: () => void;
};

export const GeneralDocumentUploadDialog: React.FC<Props> = ({
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
      titleOverride="Add Completeness Document(s)"
      onDocumentUploadSucceeded={onDocumentUploadSucceeded}
    />
  );
};
