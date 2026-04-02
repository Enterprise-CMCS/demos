import React from "react";

import { AddDocumentDialog } from "components/dialog/document";
import { DocumentType } from "demos-server";
import { DEMONSTRATION_DETAIL_QUERY } from "pages/DemonstrationDetail/DemonstrationDetail";
import { GET_WORKFLOW_DEMONSTRATION_QUERY } from "components/application/demonstration/DemonstrationWorkflow";
import { GET_AMENDMENT_WORKFLOW_QUERY, GET_EXTENSION_WORKFLOW_QUERY } from "components/application";

const DOCUMENT_TYPE_SUBSET: DocumentType[] = ["Pre-Submission", "General File"];

export const ConceptPreSubmissionUploadDialog = ({
  applicationId,
  onClose,
}: {
  applicationId: string;
  onClose: () => void;
}) => {
  return (
    <AddDocumentDialog
      applicationId={applicationId}
      onClose={onClose}
      documentTypeSubset={DOCUMENT_TYPE_SUBSET}
      titleOverride="Pre-Submission Document"
      refetchQueries={[
        DEMONSTRATION_DETAIL_QUERY,
        GET_WORKFLOW_DEMONSTRATION_QUERY,
        GET_AMENDMENT_WORKFLOW_QUERY,
        GET_EXTENSION_WORKFLOW_QUERY,
      ]}
      phaseName="Concept"
    />
  );
};
