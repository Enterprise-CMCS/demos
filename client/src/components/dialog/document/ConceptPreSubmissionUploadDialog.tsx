import React from "react";

import { AddDocumentDialog } from "components/dialog/document/DocumentDialog";
import { DocumentType } from "demos-server";

const DOCUMENT_TYPE_SUBSET: DocumentType[] = ["Pre-Submission", "General File"];

const REFETCH_QUERIES = ["GetConceptDocuments", "GetDemonstrationDocuments"];

type Props = {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  refetchQueries?: string[];
  onDocumentUploadSucceeded: () => void;
};

export const ConceptPreSubmissionUploadDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  applicationId,
  refetchQueries = REFETCH_QUERIES,
  onDocumentUploadSucceeded,
}) => {
  return (
    <AddDocumentDialog
      key={isOpen ? "open" : "closed"}
      isOpen={isOpen}
      onClose={onClose}
      documentTypeSubset={DOCUMENT_TYPE_SUBSET}
      applicationId={applicationId}
      titleOverride="Pre-Submission Document"
      refetchQueries={refetchQueries}
      onDocumentUploadSucceeded={onDocumentUploadSucceeded}
    />
  );
};
