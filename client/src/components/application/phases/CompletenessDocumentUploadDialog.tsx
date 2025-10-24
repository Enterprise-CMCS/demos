import React from "react";

import { AddDocumentDialog } from "components/dialog/document/DocumentDialog";
import { DocumentType } from "demos-server";

// Minimal wrapper to seed the Completeness upload flow with sensible defaults
const DOCUMENT_TYPE_SUBSET: DocumentType[] = ["Application Completeness Letter", "General File"];

const REFETCH_QUERIES = [
  "GetCompletenessDocuments",
  "GetDemonstrationDocuments",
  "DemonstrationDetailQuery",
];

// This needs to be a toast. But more permanent. - not sure if this is the same.
type Props = {
  isOpen: boolean;
  onClose: () => void;
  applicationId?: string; // optional starter prop; can be wired later
  refetchQueries?: string[];
};

export const CompletenessDocumentUploadDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  applicationId = "demo-id-placeholder",
  refetchQueries = REFETCH_QUERIES,
}) => {
  return (
    <AddDocumentDialog
      key={isOpen ? "open" : "closed"}
      isOpen={isOpen}
      onClose={onClose}
      documentTypeSubset={DOCUMENT_TYPE_SUBSET}
      applicationId={applicationId}
      titleOverride="Add Completeness Document(s)"
      refetchQueries={refetchQueries}
    />
  );
};
