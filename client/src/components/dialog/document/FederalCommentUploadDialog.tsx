import React from "react";

import { AddDocumentDialog, DocumentDialogFields } from "components/dialog/document/DocumentDialog";
import { DocumentType } from "demos-server";

const DOCUMENT_TYPE_SUBSET: DocumentType[] = ["General File"];

const REFETCH_QUERIES = ["GetConceptDocuments", "GetDemonstrationDocuments"];

type Props = {
  isOpen: boolean;
  onClose: () => void;
  bundleId: string;
  refetchQueries?: string[];
};

export const FederalCommentUploadDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  bundleId,
}) => {
  const getInitialDocument = (): DocumentDialogFields => ({
    id: bundleId,
    title: "",
    description: "",
    documentType: "General File",
    file: null,
  });

  return (
    <AddDocumentDialog
      key={isOpen ? "open" : "closed"}
      isOpen={isOpen}
      onClose={onClose}
      documentTypeSubset={DOCUMENT_TYPE_SUBSET}
      initialDocument={getInitialDocument()}
      titleOverride="Internal Analysis Document"
      refetchQueries={REFETCH_QUERIES}
    />
  );
};
