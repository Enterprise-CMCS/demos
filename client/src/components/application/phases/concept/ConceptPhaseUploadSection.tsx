import React from "react";
import { SecondaryButton } from "components/button";
import { ExportIcon } from "components/icons";
import { DocumentList } from "components/application/phases/sections";
import type { ApplicationWorkflowDocument } from "components/application";
import { getCurrentUser, isReadonly } from "components/user/UserContext";
import { useDialog } from "components/dialog/DialogContext";

export const UPLOAD_BUTTON_NAME = "button-open-upload-modal";
export const CONCEPT_PHASE_STEP_ONE_DESCRIPTION_NAME = "concept-phase-step-one-description";
export const CONCEPT_PHASE_STEP_ONE_DESCRIPTION_TEXT =
  "Upload the Pre-Submission Concept Paper and any supplemental documents when they are available.";

export const ConceptPhaseUploadSection = ({
  applicationId,
  documents,
}: {
  applicationId: string;
  documents: ApplicationWorkflowDocument[];
}) => {
  const { currentUser } = getCurrentUser();
  const { showConceptPreSubmissionDocumentUploadDialog } = useDialog();

  const isReadonlyUser = isReadonly(currentUser);

  return (
    <div aria-labelledby="state-application-upload-title">
      <h4 id="state-application-upload-title" className="text-xl font-semibold mb-1 uppercase">
        Step 1 - Upload
      </h4>
      <p
        data-testid={CONCEPT_PHASE_STEP_ONE_DESCRIPTION_NAME}
        className="text-sm text-text-placeholder mb-2"
      >
        {CONCEPT_PHASE_STEP_ONE_DESCRIPTION_TEXT}
      </p>

      <SecondaryButton
        isHidden={isReadonlyUser}
        onClick={() => showConceptPreSubmissionDocumentUploadDialog(applicationId)}
        size="small"
        name={UPLOAD_BUTTON_NAME}
      >
        Upload
        <ExportIcon />
      </SecondaryButton>

      <DocumentList documents={documents} />
    </div>
  );
};
