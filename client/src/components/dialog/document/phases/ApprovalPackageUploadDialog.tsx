import React from "react";
import { DocumentType } from "demos-server";
import { AddDocumentDialog } from "components/dialog/document";
import { GET_WORKFLOW_DEMONSTRATION_QUERY } from "components/application/demonstration/DemonstrationWorkflow";
import { GET_AMENDMENT_WORKFLOW_QUERY } from "components/application/amendment/AmendmentWorkflow";
import { GET_EXTENSION_WORKFLOW_QUERY } from "components/application/extension/ExtensionWorkflow";

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
  return (
    <AddDocumentDialog
      applicationId={applicationId}
      onClose={onClose}
      documentTypeSubset={[documentType]}
      titleOverride="Add Approval Package Document(s)"
      phaseName="Approval Package"
      refetchQueries={[
        GET_WORKFLOW_DEMONSTRATION_QUERY,
        GET_AMENDMENT_WORKFLOW_QUERY,
        GET_EXTENSION_WORKFLOW_QUERY,
      ]}
    />
  );
};
