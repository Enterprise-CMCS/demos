import React from "react";
import { DocumentType } from "demos-server";
import { AddDocumentDialog } from "components/dialog/document";
import { GET_WORKFLOW_DEMONSTRATION_QUERY } from "components/application/demonstration/DemonstrationWorkflow";
import { GET_AMENDMENT_WORKFLOW_QUERY, GET_EXTENSION_WORKFLOW_QUERY } from "components/application";

const COMPLETENESS_DOCUMENT_TYPES: DocumentType[] = [
  "Application Completeness Letter",
  "General File",
  "Internal Completeness Review Form",
];

export const CompletenessDocumentUploadDialog = ({
  onClose,
  applicationId,
}: {
  applicationId: string;
  onClose: () => void;
}) => {
  return (
    <AddDocumentDialog
      applicationId={applicationId}
      onClose={onClose}
      documentTypeSubset={COMPLETENESS_DOCUMENT_TYPES}
      titleOverride="Add Completeness Document"
      phaseName="Completeness"
      refetchQueries={[
        GET_WORKFLOW_DEMONSTRATION_QUERY,
        GET_AMENDMENT_WORKFLOW_QUERY,
        GET_EXTENSION_WORKFLOW_QUERY,
      ]}
    />
  );
};
