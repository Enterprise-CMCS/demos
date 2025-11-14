import React from "react";
import { DocumentType } from "demos-server";
import { AddDocumentDialog } from "components/dialog/document/DocumentDialog";
import { GET_WORKFLOW_DEMONSTRATION_QUERY } from "components/application/ApplicationWorkflow";

type Props = {
  applicationId: string;
  documentType: DocumentType
  onClose: () => void;
};

export const ApprovalPackageUploadDialog: React.FC<Props> = ({ onClose, applicationId, documentType }) => {
  return (
    <AddDocumentDialog
      applicationId={applicationId}
      onClose={onClose}
      documentTypeSubset={[documentType]}
      titleOverride="Add Approval Package Document(s)"
      phaseName="Approval Package"
      refetchQueries={[
        { query: GET_WORKFLOW_DEMONSTRATION_QUERY, variables: { id: applicationId } },
      ]}
    />
  );
};
