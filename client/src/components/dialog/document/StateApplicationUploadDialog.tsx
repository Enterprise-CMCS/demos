import React from "react";

import { AddDocumentDialog } from "components/dialog/document/DocumentDialog";
import { DocumentType } from "demos-server";

const DOCUMENT_TYPE_SUBSET: DocumentType[] = ["State Application", "General File"];

const REFETCH_QUERIES = ["GetStateApplicationDocuments", "GetDemonstrationDocuments"];

type Props = {
  isOpen: boolean;
  onClose: () => void;
  bundleId: string;
};

export const StateApplicationUploadDialog: React.FC<Props> = ({ isOpen, onClose, bundleId }) => {
  return (
    <AddDocumentDialog
      key={isOpen ? "open" : "closed"}
      isOpen={isOpen}
      onClose={onClose}
      documentTypeSubset={DOCUMENT_TYPE_SUBSET}
      bundleId={bundleId}
      titleOverride="Add State Application"
      refetchQueries={REFETCH_QUERIES}
    />
  );
};
