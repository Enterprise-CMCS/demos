import React from "react";
import { DocumentType } from "demos-server";
import { AddDocumentDialog } from "components/dialog/document";
import { GET_WORKFLOW_DEMONSTRATION_QUERY } from "components/application/ApplicationWorkflow";

const DOCUMENT_TYPE_SUBSET: DocumentType[] = [
  "Application Completeness Letter",
  "General File",
  "Internal Completeness Review Form",
];

type Props = {
  applicationId: string;
  onClose: () => void;
};

export const CompletenessDocumentUploadDialog: React.FC<Props> = ({ onClose, applicationId }) => {
  return (
    <AddDocumentDialog
      applicationId={applicationId}
      onClose={onClose}
      documentTypeSubset={DOCUMENT_TYPE_SUBSET}
      titleOverride="Add Completeness Document"
      phaseName="Completeness"
      refetchQueries={[GET_WORKFLOW_DEMONSTRATION_QUERY]}
    />
  );
};
