import React from "react";

import { AddDocumentToPhaseDialog } from "components/dialog/document";
import { DocumentType } from "demos-server";
import {
  GET_AMENDMENT_WORKFLOW_QUERY,
  GET_RENEWAL_WORKFLOW_QUERY,
  GET_WORKFLOW_DEMONSTRATION_QUERY,
} from "components/application";

const SDG_PREPARATION_DOCUMENT_TYPES: DocumentType[] = ["General File"];

export const SdgPreparationUploadDialog = ({
  onClose,
  applicationId,
}: {
  onClose: () => void;
  applicationId: string;
}) => {
  return (
    <AddDocumentToPhaseDialog
      onClose={onClose}
      documentTypeSubset={SDG_PREPARATION_DOCUMENT_TYPES}
      applicationId={applicationId}
      titleOverride="Add Draft Document"
      refetchQueries={[
        GET_AMENDMENT_WORKFLOW_QUERY,
        GET_RENEWAL_WORKFLOW_QUERY,
        GET_WORKFLOW_DEMONSTRATION_QUERY,
      ]}
      phaseName="SDG Preparation"
    />
  );
};
