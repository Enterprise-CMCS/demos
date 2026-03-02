import React from "react";

import { AddDocumentDialog } from "components/dialog/document";
import { DocumentType } from "demos-server";

const DOCUMENT_TYPE_SUBSET: DocumentType[] = [
  "General File",
  "Federal Comment Internal Analysis Document",
];

const REFETCH_QUERIES = ["GetConceptDocuments", "GetDemonstrationDocuments"];

type Props = {
  onClose: () => void;
  applicationId: string;
};

export const FederalCommentUploadDialog: React.FC<Props> = ({ onClose, applicationId }) => {
  return (
    <AddDocumentDialog
      onClose={onClose}
      documentTypeSubset={DOCUMENT_TYPE_SUBSET}
      applicationId={applicationId}
      titleOverride="Add Federal Comment Document"
      refetchQueries={REFETCH_QUERIES}
      phaseName="Federal Comment"
    />
  );
};
