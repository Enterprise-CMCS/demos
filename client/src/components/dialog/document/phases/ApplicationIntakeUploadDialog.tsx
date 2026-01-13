import React from "react";

import { AddDocumentDialog } from "components/dialog/document";
import { DocumentType } from "demos-server";
import { DEMONSTRATION_DETAIL_QUERY } from "pages/DemonstrationDetail/DemonstrationDetail";
import { GET_WORKFLOW_DEMONSTRATION_QUERY } from "components/application/ApplicationWorkflow";

const DOCUMENT_TYPE_SUBSET: DocumentType[] = ["State Application", "General File"];

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
      refetchQueries={[GET_WORKFLOW_DEMONSTRATION_QUERY, DEMONSTRATION_DETAIL_QUERY]}
      onDocumentUploadSucceeded={onDocumentUploadSucceeded}
      phaseName="Application Intake"
    />
  );
};
