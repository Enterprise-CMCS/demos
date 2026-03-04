import React from "react";

import { AddDocumentDialog } from "components/dialog/document";
import { DocumentType, UploadDocumentInput } from "demos-server";
import { DEMONSTRATION_DETAIL_QUERY } from "pages/DemonstrationDetail/DemonstrationDetail";
import { GET_AMENDMENT_WORKFLOW_QUERY, GET_EXTENSION_WORKFLOW_QUERY } from "components/application";

const DOCUMENT_TYPE_SUBSET: DocumentType[] = ["Pre-Submission", "General File"];

type Props = {
  onClose: () => void;
  applicationId: string;
  onDocumentUploadSucceeded: (payload?: UploadDocumentInput) => void;
};

export const ConceptPreSubmissionUploadDialog: React.FC<Props> = ({
  onClose,
  applicationId,
  onDocumentUploadSucceeded,
}) => {
  return (
    <AddDocumentDialog
      applicationId={applicationId}
      onClose={onClose}
      documentTypeSubset={DOCUMENT_TYPE_SUBSET}
      titleOverride="Pre-Submission Document"
      onDocumentUploadSucceeded={onDocumentUploadSucceeded}
      refetchQueries={[
        DEMONSTRATION_DETAIL_QUERY,
        GET_AMENDMENT_WORKFLOW_QUERY,
        GET_EXTENSION_WORKFLOW_QUERY,
      ]}
      phaseName="Concept"
    />
  );
};
