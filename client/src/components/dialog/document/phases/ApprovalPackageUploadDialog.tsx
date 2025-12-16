import React from "react";
import { DocumentType } from "demos-server";
import { AddDocumentDialog } from "components/dialog/document";
import { GET_WORKFLOW_DEMONSTRATION_QUERY } from "components/application/ApplicationWorkflow";

type Props = {
  applicationId: string;
  documentType: DocumentType;
};

export const ApprovalPackageUploadDialog: React.FC<Props> = ({ applicationId, documentType }) => {
  return (
    <AddDocumentDialog
      applicationId={applicationId}
      documentTypeSubset={[documentType]}
      titleOverride="Add Approval Package Document(s)"
      phaseName="Approval Package"
      refetchQueries={[GET_WORKFLOW_DEMONSTRATION_QUERY]}
    />
  );
};
