import React from "react";

import { SecondaryButton } from "components/button";
import { ExportIcon } from "components/icons";
import { ApplicationWorkflowDocument } from "components/application";
import { DocumentList } from "../sections";
import {
  COMPLETENESS_PHASE_STEP_ONE_DESCRIPTION,
  COMPLETENESS_UPLOAD_BUTTON_NAME,
} from "./CompletenessPhase";

export const UploadSection = ({
  applicationId,
  completenessDocuments,
  onUploadClick,
}: {
  applicationId: string;
  completenessDocuments: ApplicationWorkflowDocument[];
  onUploadClick: (applicationId: string) => void;
}) => (
  <div aria-labelledby="completeness-upload-title">
    <h4 id="completeness-upload-title" className="text-xl font-semibold mb-2 uppercase">
      Step 1 - Upload
    </h4>
    <p
      className={"text-sm text-text-placeholder mb-2"}
      data-testId={COMPLETENESS_PHASE_STEP_ONE_DESCRIPTION.testId}
    >
      {COMPLETENESS_PHASE_STEP_ONE_DESCRIPTION.text}
    </p>
    <SecondaryButton
      onClick={() => onUploadClick(applicationId)}
      size="small"
      name={COMPLETENESS_UPLOAD_BUTTON_NAME}
    >
      Upload
      <ExportIcon />
    </SecondaryButton>
    <DocumentList documents={completenessDocuments} />
  </div>
);
