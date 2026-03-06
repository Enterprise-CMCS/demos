import React from "react";
import { DocumentType } from "demos-server";
import { AddDocumentDialog } from "components/dialog/document";
import { GET_WORKFLOW_DEMONSTRATION_QUERY } from "components/application/demonstration/DemonstrationWorkflow";

type Props = {
  applicationId: string;
  documentType: DocumentType;
  onClose: () => void;
};

export const ApprovalPackageUploadDialog: React.FC<Props> = ({
  onClose,
  applicationId,
  documentType,
}) => {
  const phaseName = documentType === "Final BN Worksheet" ? "None" : "Approval Package";

  return (
    <AddDocumentDialog
      applicationId={applicationId}
      onClose={onClose}
      documentTypeSubset={[documentType]}
      titleOverride="Add Approval Package Document(s)"
      phaseName={phaseName}
      refetchQueries={[GET_WORKFLOW_DEMONSTRATION_QUERY]}
    />
  );
};
