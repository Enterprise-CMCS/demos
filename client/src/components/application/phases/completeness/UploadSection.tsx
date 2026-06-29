import React from "react";

import { SecondaryButton } from "components/button";
import { ExportIcon } from "components/icons";
import { tw } from "tags/tw";
import { ApplicationWorkflowDocument } from "components/application";
import { DocumentList } from "../sections";
import {
  COMPLETENESS_PHASE_STEP_ONE_DESCRIPTION,
  COMPLETENESS_UPLOAD_BUTTON_NAME,
} from "./CompletenessPhase";

const STYLES = {
  title: tw`text-xl font-semibold mb-2 uppercase`,
  helper: tw`text-sm text-text-placeholder mb-2`,
};

interface UploadSectionProps {
  applicationId: string;
  completenessDocuments: ApplicationWorkflowDocument[];
  onUploadClick: (applicationId: string) => void;
}

export const UploadSection = ({
  applicationId,
  completenessDocuments,
  onUploadClick,
}: UploadSectionProps) => (
  <div aria-labelledby="completeness-upload-title">
    <h4 id="completeness-upload-title" className={STYLES.title}>
      Step 1 - Upload
    </h4>
    <p className={STYLES.helper} data-testId={COMPLETENESS_PHASE_STEP_ONE_DESCRIPTION.testId}>
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
