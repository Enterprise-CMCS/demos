import React from "react";
import { DocumentType, UploadDocumentInput } from "demos-server";
import { AddDocumentDialog } from "components/dialog/document";

const DOCUMENT_TYPE_SUBSET: DocumentType[] = [
  "Application Completeness Letter",
  "General File",
  "Internal Completeness Review Form",
];

type Props = {
  applicationId: string;
  onClose: () => void;
  onDocumentUploadSucceeded?: (payload?: UploadDocumentInput) => void;
};

export const CompletenessDocumentUploadDialog: React.FC<Props> = ({
  onClose,
  applicationId,
  onDocumentUploadSucceeded,
}) => {
  return (
    <AddDocumentDialog
      applicationId={applicationId}
      onClose={onClose}
      documentTypeSubset={DOCUMENT_TYPE_SUBSET}
      titleOverride="Add Completeness Document"
      phaseName="Completeness"
      onDocumentUploadSucceeded={onDocumentUploadSucceeded}
    />
  );
};
