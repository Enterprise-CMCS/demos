import React from "react";

import { AddDocumentDialog, DocumentDialogFields } from "components/dialog/document/DocumentDialog";
import { DocumentType } from "demos-server";

const DOCUMENT_TYPE_SUBSET: DocumentType[] = ["Pre-Submission", "General File"];

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
  refetchQueries,
}) => {
  const getInitialDocument = (): DocumentDialogFields => ({
    id: bundleId,
    title: "",
    description: "",
    documentType: "Pre-Submission",
    file: null,
  });

  return (
    <AddDocumentDialog
      key={isOpen ? "open" : "closed"}
      isOpen={isOpen}
      onClose={onClose}
      documentTypeSubset={DOCUMENT_TYPE_SUBSET}
      initialDocument={getInitialDocument()}
      titleOverride="Pre-Submission Document"
      refetchQueries={refetchQueries}
    />
  );
};
