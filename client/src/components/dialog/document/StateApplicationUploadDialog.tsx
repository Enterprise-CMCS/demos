import React from "react";

import {
  AddDocumentDialog,
  DocumentDialogFields,
} from "components/dialog/document/DocumentDialog";
import { DocumentType } from "demos-server";

const DOCUMENT_TYPE_SUBSET: DocumentType[] = ["State Application", "General File"];

const REFETCH_QUERIES = ["GetStateApplicationDocuments", "GetDemonstrationDocuments"];

type Props = {
  isOpen: boolean;
  onClose: () => void;
  bundleId: string;
};

export const StateApplicationUploadDialog: React.FC<Props> = ({ isOpen, onClose, bundleId }) => {
  const getInitialDocument = (): DocumentDialogFields => ({
    id: bundleId,
    title: "",
    description: "",
    documentType: DOCUMENT_TYPE_SUBSET[0],
    file: null,
  });

  return (
    <AddDocumentDialog
      key={isOpen ? "open" : "closed"}
      isOpen={isOpen}
      onClose={onClose}
      documentTypeSubset={DOCUMENT_TYPE_SUBSET}
      initialDocument={getInitialDocument()}
      titleOverride="Add State Application"
      refetchQueries={REFETCH_QUERIES}
    />
  );
};
