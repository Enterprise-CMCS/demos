import React from "react";

import { AddDocumentDialog } from "components/dialog/document";
import { DocumentType } from "demos-server";
import { DEMONSTRATION_DETAIL_QUERY } from "pages/DemonstrationDetail/DemonstrationDetail";

const DOCUMENT_TYPE_SUBSET: DocumentType[] = ["Pre-Submission", "General File"];

type Props = {
  applicationId: string;
  onDocumentUploadSucceeded: () => void;
};

export const ConceptPreSubmissionUploadDialog: React.FC<Props> = ({
  applicationId,
  onDocumentUploadSucceeded,
}) => {
  return (
    <AddDocumentDialog
      applicationId={applicationId}
      documentTypeSubset={DOCUMENT_TYPE_SUBSET}
      titleOverride="Pre-Submission Document"
      onDocumentUploadSucceeded={onDocumentUploadSucceeded}
      refetchQueries={[DEMONSTRATION_DETAIL_QUERY]}
      phaseName="Concept"
    />
  );
};
