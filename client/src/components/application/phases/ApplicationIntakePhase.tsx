import React, { useEffect, useState } from "react";

import { useMutation } from "@apollo/client";

import { Button, SecondaryButton } from "components/button";
import { ExportIcon } from "components/icons";
import { addDays, compareDesc, parseISO } from "date-fns";
import { tw } from "tags/tw";
import { formatDateForServer, getDateEst } from "util/formatDate";
import { WorkflowApplication, ApplicationWorkflowDocument } from "components/application";
import { PhaseName } from "components/application/phase-selector/PhaseSelector";
import { useCompletePhase } from "components/application/phase-status/phaseCompletionQueries";
import { useSetApplicationDates } from "components/application/date/dateQueries";
import { useDialog } from "components/dialog/DialogContext";
import { DocumentList } from "./sections";
import { getPhaseCompletedMessage } from "util/messages";
import { useToast } from "components/toast";
import { DatePicker } from "components/input/date/DatePicker";
import { ApplicationHealthTypeTags } from "components/tags/ApplicationHealthTypeTags";
import type { PhaseStatus, Tag, TagName } from "demos-server";
import { SET_APPLICATION_TAGS_MUTATION } from "components/dialog/ApplyTagsDialog";

/** Business Rules for this Phase:
 * - **Application Intake Start Date** - Can start in one of two ways, whichever comes first:
  - a. User clicked Skip or Finish on the Concept Phase
  - b. When a change is submitted on this phase - document or date update.

- **State Application Submitted Date** - When the state formally submits their application.

- **Application Intake Completion Date** - Completed when user clicks "Finish" to progress to the next phase.

Note: If the user skips the concept phase this will be marked completed when the user clicks Finish on the Application Intake Phase.
 */
const STYLES = {
  pane: tw`bg-white p-8`,
  grid: tw`relative grid grid-cols-2 gap-10`,
  divider: tw`pointer-events-none absolute left-1/2 top-0 h-full border-l border-border-subtle`,
  stepEyebrow: tw`text-xs font-semibold uppercase tracking-wide text-text-placeholder mb-2`,
  title: tw`text-xl font-semibold mb-2`,
  helper: tw`text-sm text-text-placeholder mb-2`,
  list: tw`mt-4 space-y-3`,
  fileRow: tw`bg-surface-secondary border border-border-fields px-3 py-2 flex items-center justify-between`,
  fileMeta: tw`text-xs text-text-placeholder mt-0.5`,
  actions: tw`mt-8 flex justify-end gap-3`,
};

const THIS_PHASE_NAME: PhaseName = "Application Intake";
const NEXT_PHASE_NAME: PhaseName = "Completeness";

export const APPLICATION_INTAKE_FINISH_BUTTON_NAME = "button-finish-state-application";
export const APPLICATION_INTAKE_UPLOAD_BUTTON_NAME = "button-open-upload-modal";
export const APPLICATION_SUBMITTED_DATEPICKER_NAME = "datepicker-state-application-submitted-date";
export const COMPLETENESS_REVIEW_DATEPICKER_NAME = "datepicker-completeness-review-due-date";

const UploadSection = ({
  applicationId,
  documents,
}: {
  applicationId: string;
  documents: ApplicationWorkflowDocument[];
}) => {
  const { showApplicationIntakeDocumentUploadDialog } = useDialog();

  return (
    <div aria-labelledby="state-application-upload-title">
      <h4 id="state-application-upload-title" className={STYLES.title}>
        STEP 1 - UPLOAD
      </h4>
      <p className={STYLES.helper}>Upload State Application file</p>

      <SecondaryButton
        onClick={() => showApplicationIntakeDocumentUploadDialog(applicationId)}
        size="small"
        name={APPLICATION_INTAKE_UPLOAD_BUTTON_NAME}
      >
        Upload
        <ExportIcon />
      </SecondaryButton>

      <DocumentList documents={documents} />
    </div>
  );
};

// Calculate completeness review due date (submitted date + 15 calendar days)
export const getCompletenessReviewDueDate = (stateApplicationSubmittedDate: string): Date => {
  const date = parseISO(stateApplicationSubmittedDate);
  return addDays(date, 15);
};

export const calculateStateApplicationSubmittedDate = (
  initialStateApplicationSubmittedDate: string,
  documents: ApplicationWorkflowDocument[]
): string => {
  // if a state application submitted date is provided, return this
  if (initialStateApplicationSubmittedDate) return initialStateApplicationSubmittedDate;

  const stateApplicationDocuments = documents.filter(
    (document) => document.documentType === "State Application"
  );

  // Guard: No state application documents means no date to return
  if (stateApplicationDocuments.length === 0) return "";

  // Get latest createdAt date in EST from state application documents
  const createdAtDates = stateApplicationDocuments.map((doc) => doc.createdAt);
  const sortedDates = createdAtDates.sort(compareDesc);
  return getDateEst(sortedDates[0]);
};

interface VerifyCompleteSectionProps {
  stateApplicationSubmittedDate: string;
  hasDocuments: boolean;
  onDateChange: (newDate: string) => void;
  isFinishButtonEnabled: boolean;
  onFinish: () => void;
  isPhaseFinalized: boolean;
}

const VerifyCompleteSection = ({
  stateApplicationSubmittedDate,
  hasDocuments,
  onDateChange,
  isFinishButtonEnabled,
  onFinish,
  isPhaseFinalized,
}: VerifyCompleteSectionProps) => {
  const completenessReviewDueDate = stateApplicationSubmittedDate
    ? formatDateForServer(getCompletenessReviewDueDate(stateApplicationSubmittedDate))
    : "";

  return (
    <div aria-labelledby="state-application-verify-title">
      <div className={STYLES.stepEyebrow}>Step 2 - Verify/Complete</div>
      <h4 id="state-application-verify-title" className={STYLES.title}>
        VERIFY/COMPLETE
      </h4>
      <p className={STYLES.helper}>
        Verify that the document is uploaded/accurate and that all required fields are filled.
      </p>

      <div className="space-y-4">
        <div>
          <DatePicker
            name={APPLICATION_SUBMITTED_DATEPICKER_NAME}
            label="State Application Submitted Date"
            value={stateApplicationSubmittedDate}
            onChange={onDateChange}
            isRequired
            aria-required="true"
            isDisabled={isPhaseFinalized}
          />
          {!hasDocuments && stateApplicationSubmittedDate && (
            <div className="text-xs text-text-warn mt-1">
              At least one State Application document is required when date is provided
            </div>
          )}
        </div>

        <div>
          <DatePicker
            name={COMPLETENESS_REVIEW_DATEPICKER_NAME}
            label="Completeness Review Due Date"
            value={completenessReviewDueDate}
            isDisabled={true}
          />
          <div id="completeness-review-help" className="text-xs text-text-placeholder mt-1">
            Automatically calculated as 15 calendar days after State Application Submitted Date
          </div>
        </div>
      </div>

      <div className={STYLES.actions}>
        <Button
          name={APPLICATION_INTAKE_FINISH_BUTTON_NAME}
          onClick={onFinish}
          disabled={!isFinishButtonEnabled}
          size="small"
        >
          Finish
        </Button>
      </div>
    </div>
  );
};

export const getApplicationIntakeComponentFromApplication = (
  application: WorkflowApplication,
  setSelectedPhase: (phase: PhaseName) => void
) => {
  const applicationIntakePhase = application.phases.find(
    (phase) => phase.phaseName === THIS_PHASE_NAME
  );

  if (!applicationIntakePhase) {
    throw new Error(`Application is missing expected phase: ${THIS_PHASE_NAME}`);
  }

  const stateApplicationSubmittedDate = applicationIntakePhase.phaseDates.find(
    (date) => date.dateType === "State Application Submitted Date"
  )?.dateValue;

  const applicationIntakeDocuments = application.documents.filter(
    (doc) => doc.phaseName === THIS_PHASE_NAME
  );

  return (
    <ApplicationIntakePhase
      applicationId={application.id}
      applicationIntakeDocuments={applicationIntakeDocuments}
      initialStateApplicationSubmittedDate={
        stateApplicationSubmittedDate ? getDateEst(stateApplicationSubmittedDate) : ""
      }
      tags={application.tags}
      setSelectedPhase={setSelectedPhase}
      phaseStatus={applicationIntakePhase.phaseStatus ?? "Not Started"}
    />
  );
};
export interface ApplicationIntakeProps {
  applicationId: string;
  applicationIntakeDocuments: ApplicationWorkflowDocument[];
  initialStateApplicationSubmittedDate: string;
  tags: Tag[];
  setSelectedPhase: (phase: PhaseName) => void;
  phaseStatus: PhaseStatus;
}

export const ApplicationIntakePhase = ({
  applicationId,
  applicationIntakeDocuments,
  initialStateApplicationSubmittedDate,
  tags,
  setSelectedPhase,
  phaseStatus,
}: ApplicationIntakeProps) => {
  const { showSuccess, showError } = useToast();
  const { completePhase } = useCompletePhase();
  const { setApplicationDates } = useSetApplicationDates();
  const [setApplicationTagsMutation] = useMutation(SET_APPLICATION_TAGS_MUTATION);

  const [stateApplicationSubmittedDateOverride, setStateApplicationSubmittedDateOverride] =
    useState<string>("");

  // Calculate the state application submitted date based on the following precedence:
  // 1. If the user has manually entered a date (stateApplicationSubmittedDateOverride), use this
  // 2. If no manual date, calculate based on the latest createdAt date of State Application documents
  const stateApplicationSubmittedDate = stateApplicationSubmittedDateOverride
    ? stateApplicationSubmittedDateOverride
    : calculateStateApplicationSubmittedDate(
        initialStateApplicationSubmittedDate,
        applicationIntakeDocuments
      );

  const isPhaseFinalized = phaseStatus === "Completed";
  const hasDocuments = applicationIntakeDocuments.length > 0;
  const isFinishButtonEnabled =
    hasDocuments && Boolean(stateApplicationSubmittedDate) && !isPhaseFinalized;

  const sendDatesToServer = async (stateApplicationSubmittedDate: string) => {
    const completenessReviewDueDate = getCompletenessReviewDueDate(stateApplicationSubmittedDate);

    await setApplicationDates({
      applicationId: applicationId,
      applicationDates: [
        {
          dateType: "State Application Submitted Date",
          dateValue: formatDateForServer(stateApplicationSubmittedDate),
        },
        {
          dateType: "Completeness Review Due Date",
          dateValue: formatDateForServer(completenessReviewDueDate),
        },
      ],
    });
  };

  const onFinishButtonClick = async () => {
    await sendDatesToServer(stateApplicationSubmittedDate);
    await completePhase({
      applicationId: applicationId,
      phaseName: THIS_PHASE_NAME,
    });
    showSuccess(getPhaseCompletedMessage(THIS_PHASE_NAME));
    setSelectedPhase?.(NEXT_PHASE_NAME);
  };

  const handleRemoveTag = async (tagName: TagName) => {
    const updatedTags = tags.filter((item) => item.tagName !== tagName);
    try {
      await setApplicationTagsMutation({
        variables: {
          input: {
            applicationId: applicationId,
            applicationTags: updatedTags.map((tag) => tag.tagName),
          },
        },
      });
      showSuccess("Application tags updated");
    } catch (error) {
      // Roll back on failure
      showError("Failed to update application tags");
      throw error;
    }
  };

  return (
    <div>
      <h3 className="text-brand text-[22px] font-bold">APPLICATION INTAKE</h3>
      <p className="text-sm text-text-placeholder mb-4">
        When the state submits an official application, completing this form closes Pre-Submission
        Technical Assistance and opens the Completeness Review period
      </p>

      <section className={STYLES.pane}>
        <div className={STYLES.grid}>
          <span aria-hidden className={STYLES.divider} />
          <UploadSection applicationId={applicationId} documents={applicationIntakeDocuments} />
          <VerifyCompleteSection
            stateApplicationSubmittedDate={stateApplicationSubmittedDate}
            hasDocuments={hasDocuments}
            onDateChange={setStateApplicationSubmittedDateOverride}
            isFinishButtonEnabled={isFinishButtonEnabled}
            onFinish={onFinishButtonClick}
            isPhaseFinalized={isPhaseFinalized}
          />
        </div>
        <div className="mt-8">
          <ApplicationHealthTypeTags
            applicationId={applicationId}
            title={"STEP 3 - APPLY TAGS"}
            description={
              "You must tag this application with one or more demonstration types involved in this request before it can be reviewed and approved."
            }
            selectedTags={tags}
            onRemoveTag={handleRemoveTag}
          />
        </div>
      </section>
    </div>
  );
};
