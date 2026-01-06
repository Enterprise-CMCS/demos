import React from "react";

import { AddDocumentDialog } from "components/dialog/document";
import { DocumentType } from "demos-server";
import { ApplicationWorkflowDocument } from "components/application/ApplicationWorkflow";

const DOCUMENT_TYPE_SUBSET: DocumentType[] = ["State Application", "General File"];

const REFETCH_QUERIES = ["GetDemonstrationDetail"];

type Props = {
  onClose: () => void;
  applicationId: string;
  onDocumentUploadSucceeded: (uploadedDocuments: ApplicationWorkflowDocument[]) => void;
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
