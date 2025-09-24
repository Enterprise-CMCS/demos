import React from "react";

import { AddDocumentDialog, DocumentDialogFields } from "components/dialog/document/DocumentDialog";
import { DocumentType } from "demos-server";

// Minimal wrapper to seed the Completeness upload flow with sensible defaults
const DOCUMENT_TYPE_SUBSET: DocumentType[] = ["Application Completeness Letter", "General File"];

const REFETCH_QUERIES = ["GetCompletenessDocuments", "GetDemonstrationDocuments"];

// This needs to be a toast. But more permanent. - not sure if this is the same.
type Props = {
  isOpen: boolean;
  onClose: () => void;
  bundleId?: string; // optional starter prop; can be wired later
  refetchQueries?: string[];
};

export const CompletenessUploadDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  bundleId = "demo-id-placeholder",
  refetchQueries = REFETCH_QUERIES,
}) => {
  const getInitialDocument = (): DocumentDialogFields => ({
    id: bundleId,
    title: "",
    description: "",
    documentType: "Application Completeness Letter",
    file: null,
  });

  return (
    <AddDocumentDialog
      key={isOpen ? "open" : "closed"}
      isOpen={isOpen}
      onClose={onClose}
      documentTypeSubset={DOCUMENT_TYPE_SUBSET}
      initialDocument={getInitialDocument()}
      titleOverride="Add Completeness Document(s)"
      refetchQueries={refetchQueries}
    />
  );
};

