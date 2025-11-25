import React, { useEffect, useState } from "react";

import { Button, SecondaryButton } from "components/button";
import { ExportIcon } from "components/icons";
import { addDays, parseISO } from "date-fns";
import { tw } from "tags/tw";
import { formatDateForServer, getTodayEst } from "util/formatDate";
import {
  ApplicationWorkflowDemonstration,
  ApplicationWorkflowDocument,
} from "components/application/ApplicationWorkflow";
import { useSetPhaseStatus } from "components/application/phase-status/phaseStatusQueries";
import { useSetApplicationDate } from "components/application/date/dateQueries";
import { useDialog } from "components/dialog/DialogContext";
import { DocumentList } from "./sections";

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

// Calculate completeness review due date (submitted date + 15 calendar days)
export const getCompletenessReviewDueDate = (stateApplicationSubmittedDate: string): Date => {
  const date = parseISO(stateApplicationSubmittedDate);
  return addDays(date, 15);
};

export const getApplicationIntakeComponentFromDemonstration = (
  demonstration: ApplicationWorkflowDemonstration
) => {
  const applicationIntakePhase = demonstration.phases.find(
    (phase) => phase.phaseName === "Application Intake"
  );

  const stateApplicationSubmittedDate = applicationIntakePhase?.phaseDates.find(
    (date) => date.dateType === "State Application Submitted Date"
  )?.dateValue;

  const stateApplicationDocuments = demonstration.documents.filter(
    (doc) => doc.documentType === "State Application"
  );

  return (
    <ApplicationIntakePhase
      demonstrationId={demonstration.id}
      initialStateApplicationDocuments={stateApplicationDocuments}
      initialStateApplicationSubmittedDate={
        stateApplicationSubmittedDate ? formatDateForServer(stateApplicationSubmittedDate) : ""
      }
    />
  );
};
export interface ApplicationIntakeProps {
  demonstrationId: string;
  initialStateApplicationDocuments: ApplicationWorkflowDocument[];
  initialStateApplicationSubmittedDate: string;
}

export const ApplicationIntakePhase = ({
  demonstrationId,
  initialStateApplicationDocuments,
  initialStateApplicationSubmittedDate,
}: ApplicationIntakeProps) => {
  const { showApplicationIntakeDocumentUploadDialog } = useDialog();
  const [stateApplicationDocuments] = useState<ApplicationWorkflowDocument[]>(
    initialStateApplicationDocuments
  );
  const [stateApplicationSubmittedDate, setStateApplicationSubmittedDate] = useState<string>(
    initialStateApplicationSubmittedDate ?? ""
  );
  const [isFinishButtonEnabled, setIsFinishButtonEnabled] = useState(false);

  const { setPhaseStatus: completeApplicationIntake } = useSetPhaseStatus({
    applicationId: demonstrationId,
    phaseName: "Application Intake",
    phaseStatus: "Completed",
  });

  const { setApplicationDate } = useSetApplicationDate();

  useEffect(() => {
    setIsFinishButtonEnabled(
      stateApplicationDocuments.length > 0 && Boolean(stateApplicationSubmittedDate)
    );
  }, [stateApplicationDocuments, stateApplicationSubmittedDate]);

  const onFinishButtonClick = async () => {
    const todayDate = getTodayEst();
    await completeApplicationIntake();

    await setApplicationDate({
      applicationId: demonstrationId,
      dateType: "Application Intake Completion Date",
      dateValue: todayDate,
    });
  };

  const handleDocumentUploadSucceeded = async () => {
    const todayDate = getTodayEst();
    setStateApplicationSubmittedDate(formatDateForServer(todayDate));

    await setApplicationDate({
      applicationId: demonstrationId,
      dateType: "State Application Submitted Date",
      dateValue: todayDate,
    });

    await setApplicationDate({
      applicationId: demonstrationId,
      dateType: "Completeness Start Date",
      dateValue: todayDate,
    });
  };

  const handleDateChange = async (newDate: string) => {
    setStateApplicationSubmittedDate(newDate);

    if (newDate) {
      const formattedNewDate = formatDateForServer(newDate);
      await setApplicationDate({
        applicationId: demonstrationId,
        dateType: "State Application Submitted Date",
        dateValue: formattedNewDate,
      });

      await setApplicationDate({
        applicationId: demonstrationId,
        dateType: "Completeness Start Date",
        dateValue: formattedNewDate,
      });
    }
  };

  const UploadSection = () => (
    <div aria-labelledby="state-application-upload-title">
      <h4 id="state-application-upload-title" className={STYLES.title}>
        STEP 1 - UPLOAD
      </h4>
      <p className={STYLES.helper}>Upload the State Application file below.</p>

      <SecondaryButton
        onClick={() =>
          showApplicationIntakeDocumentUploadDialog(demonstrationId, handleDocumentUploadSucceeded)
        }
        size="small"
        name="button-open-upload-modal"
      >
        Upload
        <ExportIcon />
      </SecondaryButton>

      <DocumentList documents={initialStateApplicationDocuments} />
    </div>
  );

  const VerifyCompleteSection = () => (
    <div aria-labelledby="state-application-verify-title">
      <div className={STYLES.stepEyebrow}>Step 2 - Verify/Complete</div>
      <h4 id="state-application-verify-title" className={STYLES.title}>
        VERIFY/COMPLETE
      </h4>
      <p className={STYLES.helper}>
        Verify that the document is uploaded/accurate and complete all required fields.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold mb-1">
            <span className="text-text-warn mr-1">*</span>
            State Application Submitted Date
          </label>
          <input
            type="date"
            value={stateApplicationSubmittedDate ?? undefined}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full border border-border-fields px-1 py-1 text-sm rounded"
            required
            aria-required="true"
          />
          {!stateApplicationDocuments && stateApplicationSubmittedDate && (
            <div className="text-xs text-text-warn mt-1">
              At least one State Application document is required when date is provided
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">Completeness Review Due Date</label>
          <input
            type="date"
            value={
              stateApplicationSubmittedDate
                ? formatDateForServer(getCompletenessReviewDueDate(stateApplicationSubmittedDate))
                : ""
            }
            disabled
            className="w-full border border-border-fields px-1 py-1 text-sm rounded bg-gray-50 text-gray-600"
            aria-describedby="completeness-review-help"
          />
          <div id="completeness-review-help" className="text-xs text-text-placeholder mt-1">
            Automatically calculated as 15 calendar days after State Application Submitted Date
          </div>
        </div>
      </div>

      <div className={STYLES.actions}>
        <Button
          name="button-finish-state-application"
          onClick={onFinishButtonClick}
          disabled={!isFinishButtonEnabled}
          size="small"
        >
          Finish
        </Button>
      </div>
    </div>
  );

  return (
    <div>
      <h3 className="text-brand text-[22px] font-bold tracking-wide mb-1">APPLICATION INTAKE</h3>
      <p className="text-sm text-text-placeholder mb-4">
        When the state submits an official application, completing this form closes the
        Pre-Submission Technical Assistance and opens the Completeness Review period
      </p>

      <section className={STYLES.pane}>
        <div className={STYLES.grid}>
          <span aria-hidden className={STYLES.divider} />
          <UploadSection />
          <VerifyCompleteSection />
        </div>
      </section>
    </div>
  );
};
