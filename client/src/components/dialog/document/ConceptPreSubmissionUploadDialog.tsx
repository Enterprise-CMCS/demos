import React from "react";

import { AddDocumentDialog } from "components/dialog/document/DocumentDialog";
import { DocumentType } from "demos-server";

const DOCUMENT_TYPE_SUBSET: DocumentType[] = ["Pre-Submission", "General File"];

const REFETCH_QUERIES = ["GetConceptDocuments", "GetDemonstrationDocuments"];

type Props = {
  isOpen: boolean;
  onClose: () => void;
  bundleId: string;
  refetchQueries?: string[];
};

export const ConceptPreSubmissionUploadDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  bundleId,
  refetchQueries = REFETCH_QUERIES,
}) => {
  return (
    <AddDocumentDialog
      key={isOpen ? "open" : "closed"}
      isOpen={isOpen}
      onClose={onClose}
      documentTypeSubset={DOCUMENT_TYPE_SUBSET}
      bundleId={bundleId}
      titleOverride="Pre-Submission Document"
      refetchQueries={refetchQueries}
    />
  );
};
