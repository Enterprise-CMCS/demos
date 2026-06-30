import React from "react";

import { tw } from "tags/tw";
import { getDateEst } from "util/formatDate";
import { WorkflowApplication, ApplicationWorkflowDocument } from "components/application";
import { DateType, PhaseName, PhaseStatus } from "demos-server";
import { CompletenessNotice } from "./CompletenessNotice";
import { UploadSection } from "./UploadSection";
import { VerifyCompleteSection } from "./VerifyCompleteSection";

const STYLES = {
  pane: tw`bg-white`,
  grid: tw`relative grid grid-cols-2 gap-10`,
  divider: tw`pointer-events-none absolute left-1/2 top-0 h-full border-l border-border-subtle`,
};

export const COMPLETENESS_PHASE_DESCRIPTION = {
  text: "Verify the application is complete and accurate. Resolving gaps confirms readiness and starts the Completeness Review period.",
  testId: "completeness-phase-description",
};
export const COMPLETENESS_PHASE_STEP_ONE_DESCRIPTION = {
  text: "Upload the Internal Completeness Review Form and the Signed Completeness Letter. Both files are required to finish the phase.",
  testId: "completeness-phase-step-one-description",
};
export const COMPLETENESS_PHASE_STEP_TWO_DESCRIPTION = {
  text: "Verify that the document is uploaded/accurate and that all required fields are filled. Review the file and fix the Submitted Date if needed. Hitting Finish sets the Due Date.",
  testId: "completeness-phase-step-two-description",
};

export const COMPLETENESS_UPLOAD_BUTTON_NAME = "button-open-completeness-upload";
export const COMPLETENESS_FINISH_BUTTON_NAME = "button-finish-completeness";
export const COMPLETENESS_DECLARE_INCOMPLETE_BUTTON_NAME = "button-declare-incomplete";
export const STATE_DEEMED_COMPLETE_DATEPICKER_NAME = "datepicker-state-application-deemed-complete";
export const FEDERAL_COMMENT_START_DATEPICKER_NAME = "datepicker-federal-comment-period-start";
export const FEDERAL_COMMENT_END_DATEPICKER_NAME = "datepicker-federal-comment-period-end";

export const getApplicationCompletenessFromApplication = (
  application: WorkflowApplication,
  setSelectedPhase: (phase: PhaseName) => void
) => {
  const completenessPhase = application.phases.find((phase) => phase.phaseName === "Completeness");

  if (!completenessPhase) {
    throw new Error("Application is missing expected phase: Completeness");
  }

  const applicationIntakePhase = application.phases.find(
    (phase) => phase.phaseName === "Application Intake"
  );

  if (!applicationIntakePhase) {
    throw new Error("Application is missing expected phase: Application Intake");
  }

  const findDate = (dateType: DateType): string => {
    const dateValue = completenessPhase.phaseDates.find(
      (date) => date.dateType === dateType
    )?.dateValue;
    return dateValue ? getDateEst(dateValue) : "";
  };

  const completenessDocuments = application.documents.filter(
    (doc) => doc.phaseName === "Completeness"
  );

  return (
    <CompletenessPhase
      applicationId={application.id}
      applicationIntakeComplete={applicationIntakePhase.phaseStatus === "Completed"}
      completenessReviewDate={findDate("Completeness Review Due Date")}
      completenessPhaseStatus={completenessPhase.phaseStatus ?? "Not Started"}
      stateDeemedCompleteDate={findDate("State Application Deemed Complete")}
      completenessDocuments={completenessDocuments}
      setSelectedPhase={setSelectedPhase}
    />
  );
};

export interface CompletenessPhaseProps {
  applicationId: string;
  applicationIntakeComplete: boolean;
  completenessReviewDate?: string;
  completenessPhaseStatus: PhaseStatus;
  stateDeemedCompleteDate: string;
  completenessDocuments: ApplicationWorkflowDocument[];
  setSelectedPhase: (phase: PhaseName) => void;
}

export const CompletenessPhase = ({
  applicationId,
  applicationIntakeComplete,
  completenessReviewDate,
  completenessPhaseStatus,
  stateDeemedCompleteDate,
  completenessDocuments,
  setSelectedPhase,
}: CompletenessPhaseProps) => {
  const completenessComplete = completenessPhaseStatus === "Completed";

  return (
    <div>
      <div className="flex flex-col gap-6">
        <CompletenessNotice
          completenessReviewDate={completenessReviewDate}
          completenessComplete={completenessComplete}
        />
        <h3 className="text-brand text-[22px] font-bold uppercase">Completeness</h3>
      </div>
      <div id="completeness-phase-content">
        <p
          className="text-sm text-text-placeholder mb-4"
          data-testid={COMPLETENESS_PHASE_DESCRIPTION.testId}
        >
          {COMPLETENESS_PHASE_DESCRIPTION.text}
        </p>

        <section className={STYLES.pane}>
          <div className={STYLES.grid}>
            <span aria-hidden className={STYLES.divider} />
            <UploadSection
              applicationId={applicationId}
              completenessDocuments={completenessDocuments}
            />
            <VerifyCompleteSection
              applicationId={applicationId}
              stateDeemedCompleteDate={stateDeemedCompleteDate}
              completenessPhaseStatus={completenessPhaseStatus}
              completenessDocuments={completenessDocuments}
              applicationIntakeComplete={applicationIntakeComplete}
              setSelectedPhase={setSelectedPhase}
            />
          </div>
        </section>
      </div>
    </div>
  );
};
