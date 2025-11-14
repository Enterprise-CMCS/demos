import React from "react";

import { AddDocumentDialog } from "components/dialog/document/DocumentDialog";
import { DocumentType } from "demos-server";

const DOCUMENT_TYPE_SUBSET: DocumentType[] = ["General File"];

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
      titleOverride="Internal Analysis Document"
      refetchQueries={REFETCH_QUERIES}
    />
  );
};
