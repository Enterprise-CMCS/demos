import React from "react";

import { AddDocumentDialog } from "components/dialog/document";
import { DocumentType } from "demos-server";

const DOCUMENT_TYPE_SUBSET: DocumentType[] = ["State Application", "General File"];

const REFETCH_QUERIES = ["GetApplicationIntakeDocuments", "GetDemonstrationDocuments"];

type Props = {
  onClose: () => void;
  applicationId: string;
  onDocumentUploadSucceeded: () => void;
};

export const ApplicationIntakeUploadDialog: React.FC<Props> = ({
  onClose,
  applicationId,
  onDocumentUploadSucceeded,
}) => {
  return (
    <AddDocumentDialog
      onClose={onClose}
      documentTypeSubset={DOCUMENT_TYPE_SUBSET}
      applicationId={applicationId}
      titleOverride="Add State Application"
      refetchQueries={REFETCH_QUERIES}
      onDocumentUploadSucceeded={onDocumentUploadSucceeded}
      phaseName="Application Intake"
    />
  );
};
