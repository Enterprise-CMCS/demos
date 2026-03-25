import React from "react";

import { AddDocumentDialog } from "components/dialog/document";
import { DocumentType } from "demos-server";
import {
  GET_AMENDMENT_WORKFLOW_QUERY,
  GET_EXTENSION_WORKFLOW_QUERY,
  GET_WORKFLOW_DEMONSTRATION_QUERY,
} from "components/application";

const FEDERAL_COMMENT_DOCUMENT_TYPES: DocumentType[] = [
  "General File",
  "Federal Comment Internal Analysis Document",
];

export const FederalCommentUploadDialog = ({
  onClose,
  applicationId,
}: {
  onClose: () => void;
  applicationId: string;
}) => {
  return (
    <AddDocumentDialog
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
