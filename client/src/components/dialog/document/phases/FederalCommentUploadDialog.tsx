import React from "react";

import { AddDocumentToPhaseDialog } from "components/dialog/document";
import { DocumentType } from "demos-server";
import {
  GET_AMENDMENT_WORKFLOW_QUERY,
  GET_EXTENSION_WORKFLOW_QUERY,
  GET_WORKFLOW_DEMONSTRATION_QUERY,
} from "components/application";

// The top item is the default for doc dialog
const FEDERAL_COMMENT_DOCUMENT_TYPES: DocumentType[] = [
  "Federal Comment Internal Analysis Document",
  "General File",
];

export const FederalCommentUploadDialog = ({
  onClose,
  applicationId,
}: {
  onClose: () => void;
  applicationId: string;
}) => {
  return (
    <AddDocumentToPhaseDialog
      onClose={onClose}
      documentTypeSubset={FEDERAL_COMMENT_DOCUMENT_TYPES}
      applicationId={applicationId}
      titleOverride="Add Federal Comment Document"
      refetchQueries={[
        GET_AMENDMENT_WORKFLOW_QUERY,
        GET_EXTENSION_WORKFLOW_QUERY,
        GET_WORKFLOW_DEMONSTRATION_QUERY,
      ]}
      phaseName="Federal Comment"
    />
  );
};
