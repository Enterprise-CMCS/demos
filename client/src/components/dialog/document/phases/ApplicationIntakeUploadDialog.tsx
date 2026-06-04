import React from "react";

import { AddDocumentToPhaseDialog } from "components/dialog/document";
import { DocumentType, UploadDocumentToPhaseInput } from "demos-server";
import { DEMONSTRATION_DETAIL_QUERY } from "pages/DemonstrationDetail/DemonstrationDetail";
import { GET_WORKFLOW_DEMONSTRATION_QUERY } from "components/application/demonstration/DemonstrationWorkflow";

const DOCUMENT_TYPE_SUBSET: DocumentType[] = ["State Application", "General File"];

type Props = {
  onClose: () => void;
  applicationId: string;
  onDocumentUploadSucceeded?: (payload?: UploadDocumentToPhaseInput) => void;
};

export const ApplicationIntakeUploadDialog: React.FC<Props> = ({
  onClose,
  applicationId,
  onDocumentUploadSucceeded,
}) => {
  return (
    <AddDocumentToPhaseDialog
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
