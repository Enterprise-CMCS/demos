import React from "react";

import { AddDocumentDialog } from "components/dialog/document";
import { DocumentType } from "demos-server";

const DOCUMENT_TYPE_SUBSET: DocumentType[] = ["General File"];

const REFETCH_QUERIES = ["GetConceptDocuments", "GetDemonstrationDocuments"];

type Props = {
  applicationId: string;
};

export const FederalCommentUploadDialog: React.FC<Props> = ({ applicationId }) => {
  return (
    <AddDocumentDialog
      documentTypeSubset={DOCUMENT_TYPE_SUBSET}
      applicationId={applicationId}
      titleOverride="Internal Analysis Document"
      refetchQueries={REFETCH_QUERIES}
      phaseName="Federal Comment"
    />
  );
};
