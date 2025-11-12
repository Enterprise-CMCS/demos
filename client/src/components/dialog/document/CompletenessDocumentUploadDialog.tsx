import React from "react";
import { DocumentType } from "demos-server";
import { AddDocumentDialog } from "components/dialog/document/DocumentDialog";
import { PureQueryOptions } from "@apollo/client";
import { GET_WORKFLOW_DEMONSTRATION_QUERY } from "components/application/ApplicationWorkflow";

const DOCUMENT_TYPE_SUBSET: DocumentType[] = [
  "Application Completeness Letter",
  "General File",
  "Internal Completeness Review Form",
];

type Props = {
  applicationId: string;
  isOpen: boolean;
  onClose: () => void;
  onDocumentUploadSucceeded?: () => void;
  refetchQueries?: Array<string | PureQueryOptions>;
};

export const CompletenessDocumentUploadDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  applicationId,
  onDocumentUploadSucceeded,
}) => {
  return (
    <AddDocumentDialog
      applicationId={applicationId}
      isOpen={isOpen}
      onClose={onClose}
      documentTypeSubset={DOCUMENT_TYPE_SUBSET}
      titleOverride="Add Completeness Document(s)"
      phaseName="Completeness"
      onDocumentUploadSucceeded={onDocumentUploadSucceeded}
      refetchQueries={[{ query: GET_WORKFLOW_DEMONSTRATION_QUERY, variables: { id: applicationId } }]}
    />
  );
};
