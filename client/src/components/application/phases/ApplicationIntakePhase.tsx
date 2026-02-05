import React, { useEffect, useState } from "react";

import { Button, SecondaryButton } from "components/button";
import { ExportIcon } from "components/icons";
import { addDays, parseISO } from "date-fns";
import { tw } from "tags/tw";
import { formatDateForServer } from "util/formatDate";
import {
  ApplicationWorkflowDemonstration,
  ApplicationWorkflowDocument,
} from "components/application/ApplicationWorkflow";
import { PhaseName } from "components/application/phase-selector/PhaseSelector";
import { useSetPhaseStatus } from "components/application/phase-status/phaseStatusQueries";
import { useSetApplicationDates } from "components/application/date/dateQueries";
import { useDialog } from "components/dialog/DialogContext";
import { DocumentList } from "./sections";
import { getPhaseCompletedMessage } from "util/messages";
import { useToast } from "components/toast";
import { DatePicker } from "components/input/date/DatePicker";
import { DemonstrationHealthTypeTags } from "components/tags/DemonstrationHealthTypeTags";
import { TEMP_SELECTED_TAGS } from "components/dialog/ApplyTagsDialog";
import type { DateTimeOrLocalDate } from "demos-server";

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

interface UploadSectionProps {
  demonstrationId: string;
  documents: ApplicationWorkflowDocument[];
  onOpenUploadModal: (demonstrationId: string) => void;
}

const UploadSection = ({ demonstrationId, documents, onOpenUploadModal }: UploadSectionProps) => (
  <div aria-labelledby="state-application-upload-title">
    <h4 id="state-application-upload-title" className={STYLES.title}>
      STEP 1 - UPLOAD
    </h4>
    <p className={STYLES.helper}>Upload the State Application file below.</p>

    <SecondaryButton
      onClick={() => onOpenUploadModal(demonstrationId)}
      size="small"
      name="button-open-upload-modal"
    >
      Upload
      <ExportIcon />
    </SecondaryButton>

    <DocumentList documents={documents} />
  </div>
);

interface VerifyCompleteSectionProps {
  stateApplicationSubmittedDate: string;
  hasDocuments: boolean;
  onDateChange: (newDate: string) => void;
  isFinishButtonEnabled: boolean;
  onFinish: () => void;
}

const VerifyCompleteSection = ({
  stateApplicationSubmittedDate,
  hasDocuments,
  onDateChange,
  isFinishButtonEnabled,
  onFinish,
}: VerifyCompleteSectionProps) => (
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
        <DatePicker
          name="datepicker-state-application-submitted-date"
          label="State Application Submitted Date"
          value={stateApplicationSubmittedDate}
          onChange={onDateChange}
          isRequired
          aria-required="true"
        />
        {!hasDocuments && stateApplicationSubmittedDate && (
          <div className="text-xs text-text-warn mt-1">
            At least one State Application document is required when date is provided
          </div>
        )}
      </div>

      <div>
        <DatePicker
          name="datepicker-completeness-review-due-date"
          label="Completeness Review Due Date"
          value={
            stateApplicationSubmittedDate
              ? formatDateForServer(getCompletenessReviewDueDate(stateApplicationSubmittedDate))
              : ""
          }
          isDisabled={true}
        />
        <div id="completeness-review-help" className="text-xs text-text-placeholder mt-1">
          Automatically calculated as 15 calendar days after State Application Submitted Date
        </div>
      </div>
    </div>

    <div className={STYLES.actions}>
      <Button
        name="button-finish-state-application"
        onClick={onFinish}
        disabled={!isFinishButtonEnabled}
        size="small"
      >
        Finish
      </Button>
    </div>
  </div>
);

export const getApplicationIntakeComponentFromDemonstration = (
  demonstration: ApplicationWorkflowDemonstration,
  setSelectedPhase?: (phase: PhaseName) => void
) => {
  const applicationIntakePhase = demonstration.phases.find(
    (phase) => phase.phaseName === "Application Intake"
  );

  const stateApplicationSubmittedDate = applicationIntakePhase?.phaseDates.find(
    (date) => date.dateType === "State Application Submitted Date"
  )?.dateValue;

  const stateApplicationDocuments = demonstration.documents.filter(
    (doc) => doc.phaseName === "Application Intake"
  );

  return (
    <ApplicationIntakePhase
      demonstrationId={demonstration.id}
      initialStateApplicationDocuments={stateApplicationDocuments}
      initialStateApplicationSubmittedDate={
        stateApplicationSubmittedDate ? formatDateForServer(stateApplicationSubmittedDate) : ""
      }
      setSelectedPhase={setSelectedPhase}
    />
  );
};
export interface ApplicationIntakeProps {
  demonstrationId: string;
  initialStateApplicationDocuments: ApplicationWorkflowDocument[];
  initialStateApplicationSubmittedDate: string;
  setSelectedPhase?: (phase: PhaseName) => void;
}

export const ApplicationIntakePhase = ({
  demonstrationId,
  initialStateApplicationDocuments,
  initialStateApplicationSubmittedDate,
  setSelectedPhase,
}: ApplicationIntakeProps) => {
  const { showSuccess } = useToast();
  const { showApplicationIntakeDocumentUploadDialog } = useDialog();
  const [stateApplicationSubmittedDate, setStateApplicationSubmittedDate] = useState<string>(
    initialStateApplicationSubmittedDate ?? ""
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(TEMP_SELECTED_TAGS);

  const { setPhaseStatus: completeApplicationIntake } = useSetPhaseStatus({
    applicationId: demonstrationId,
    phaseName: "Application Intake",
    phaseStatus: "Completed",
  });

  const { setApplicationDates } = useSetApplicationDates();

  useEffect(() => {
    const hasDocuments = initialStateApplicationDocuments.length > 0;
    const baseDate = initialStateApplicationSubmittedDate ?? "";

    if (!hasDocuments) {
      setStateApplicationSubmittedDate("");
      return;
    }

    setStateApplicationSubmittedDate(baseDate);
  }, [initialStateApplicationSubmittedDate, initialStateApplicationDocuments.length]);

  const hasDocuments = initialStateApplicationDocuments.length > 0;
  const hasSubmittedDate = Boolean(stateApplicationSubmittedDate);
  const isFinishButtonEnabled = hasDocuments && hasSubmittedDate;

  const onFinishButtonClick = async () => {
    await completeApplicationIntake();
    showSuccess(getPhaseCompletedMessage("Application Intake"));

    // Advance UI to the Completeness phase after successful completion
    setSelectedPhase?.("Completeness");
  };

  const handleDateChange = async (newDate: string) => {
    setStateApplicationSubmittedDate(newDate);

    if (newDate) {
      const formattedNewDate: DateTimeOrLocalDate = newDate as DateTimeOrLocalDate;
      const completenessReviewDueDate: DateTimeOrLocalDate = formatDateForServer(
        getCompletenessReviewDueDate(newDate)
      ) as DateTimeOrLocalDate;

      await setApplicationDates({
        applicationId: demonstrationId,
        applicationDates: [
          {
            dateType: "State Application Submitted Date",
            dateValue: formattedNewDate,
          },
          {
            dateType: "Completeness Review Due Date",
            dateValue: completenessReviewDueDate,
          },
          {
            dateType: "Completeness Start Date",
            dateValue: formattedNewDate,
          },
        ],
      });
    }
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags((prev) => prev.filter((item) => item !== tag));
  };

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
          <UploadSection
            demonstrationId={demonstrationId}
            documents={initialStateApplicationDocuments}
            onOpenUploadModal={(id) =>
              showApplicationIntakeDocumentUploadDialog(id, () => {})
            }
          />
          <VerifyCompleteSection
            stateApplicationSubmittedDate={stateApplicationSubmittedDate}
            hasDocuments={hasDocuments}
            onDateChange={handleDateChange}
            isFinishButtonEnabled={isFinishButtonEnabled}
            onFinish={onFinishButtonClick}
          />
        </div>
        <div className="mt-8">
          <DemonstrationHealthTypeTags
            title={"STEP 3 - APPLY TAGS"}
            description={
              "You must tag this application with one or more demonstration types involved in this request before it can be reviewed and approved."
            }
            selectedTags={selectedTags}
            onRemoveTag={handleRemoveTag}
          />
        </div>
      </section>
    </div>
  );
};
