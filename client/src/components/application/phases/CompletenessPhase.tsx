import React, { useEffect, useState } from "react";

import { Button, SecondaryButton } from "components/button";
import { ExportIcon } from "components/icons";
import { tw } from "tags/tw";
import { formatDateForServer } from "util/formatDate";
import { addDays, parseISO } from "date-fns";
import {
  ApplicationWorkflowDemonstration,
  ApplicationWorkflowDocument,
} from "../ApplicationWorkflow";
import { useToast } from "components/toast";
import { DocumentList } from "./sections";
import { useSetPhaseStatus } from "../phase-status/phaseStatusQueries";
import { DateType, SetApplicationDateInput } from "demos-server";
import { useDialog } from "components/dialog/DialogContext";
import { DueDateNotice } from "components/application/phases/sections/DueDateNotice";
import { useSetApplicationDate } from "components/application/date/dateQueries";

const STYLES = {
  pane: tw`bg-white`,
  grid: tw`relative grid grid-cols-2 gap-10`,
  divider: tw`pointer-events-none absolute left-1/2 top-0 h-full border-l border-border-subtle`,
  stepEyebrow: tw`text-[12px] font-semibold uppercase tracking-wide text-text-placeholder mb-2`,
  title: tw`text-xl font-semibold mb-2`,
  helper: tw`text-sm text-text-placeholder mb-2`,
  list: tw`mt-4 space-y-3`,
  fileRow: tw`bg-surface-secondary border border-border-fields px-3 py-2 flex items-center justify-between`,
  fileMeta: tw`text-[12px] text-text-placeholder mt-0.5`,
  actions: tw`mt-8 flex items-center gap-3`,
  actionsEnd: tw`ml-auto flex gap-3`,
};

const FEDERAL_COMMENT_PERIOD_DAYS = 30;

const DATES_SUCCESS_MESSAGE = "Dates saved successfully.";
const PHASE_SAVED_SUCCESS_MESSAGE = "Dates and status saved successfully.";

type CompletenessPhaseDateType = Extract<
  DateType,
  | "State Application Deemed Complete"
  | "Federal Comment Period Start Date"
  | "Federal Comment Period End Date"
  | "Completeness Completion Date"
>;

export const getInputsForCompletenessPhase = (
  applicationId: string,
  dateValues: Partial<Record<CompletenessPhaseDateType, string>>
): SetApplicationDateInput[] => {
  return Object.entries(dateValues).map(([dateType, dateValue]) => ({
    applicationId,
    dateType: dateType,
    dateValue: dateValue,
  })) as SetApplicationDateInput[];
};

export const getApplicationCompletenessFromDemonstration = (
  demonstration: ApplicationWorkflowDemonstration
) => {
  const completenessPhase = demonstration.phases.find(
    (phase) => phase.phaseName === "Completeness"
  );
  const fedCommentStartDate = completenessPhase?.phaseDates.find(
    (date) => date.dateType === "Federal Comment Period Start Date"
  );
  const fedCommentEndDate = completenessPhase?.phaseDates.find(
    (date) => date.dateType === "Federal Comment Period End Date"
  );

  const federalCommentPhase = demonstration.phases.find(
    (phase) => phase.phaseName === "Federal Comment"
  );
  const fedCommentComplete = federalCommentPhase?.phaseStatus === "Completed";

  const applicationIntakePhase = demonstration.phases.find(
    (phase) => phase.phaseName === "Application Intake"
  );
  const applicationIntakeCompletionDate = applicationIntakePhase?.phaseDates.find(
    (date) => date.dateType === "Application Intake Completion Date"
  );
  const stateDeemedCompleteDate = completenessPhase?.phaseDates.find(
    (date) => date.dateType === "State Application Deemed Complete"
  );
  const applicationCompletenessDocument = demonstration?.documents.filter(
    (doc) => doc.documentType === "Application Completeness Letter"
  );

  return (
    <CompletenessPhase
      applicationId={demonstration.id}
      fedCommentStartDate={
        fedCommentStartDate?.dateValue ? formatDateForServer(fedCommentStartDate.dateValue) : ""
      }
      fedCommentEndDate={
        fedCommentEndDate?.dateValue ? formatDateForServer(fedCommentEndDate.dateValue) : ""
      }
      fedCommentComplete={fedCommentComplete}
      stateDeemedCompleteDate={
        stateDeemedCompleteDate?.dateValue
          ? formatDateForServer(stateDeemedCompleteDate.dateValue)
          : ""
      }
      applicationCompletenessDocument={applicationCompletenessDocument ?? []}
      hasApplicationIntakeCompletionDate={!!applicationIntakeCompletionDate}
    />
  );
};

export interface CompletenessPhaseProps {
  applicationId: string;
  fedCommentStartDate?: string;
  fedCommentEndDate?: string;
  fedCommentComplete: boolean;
  stateDeemedCompleteDate?: string;
  applicationCompletenessDocument: ApplicationWorkflowDocument[];
  hasApplicationIntakeCompletionDate: boolean;
}

export const CompletenessPhase = ({
  applicationId,
  fedCommentStartDate,
  fedCommentEndDate,
  fedCommentComplete,
  stateDeemedCompleteDate,
  applicationCompletenessDocument,
  hasApplicationIntakeCompletionDate,
}: CompletenessPhaseProps) => {
  const { showCompletenessDocumentUploadDialog, showDeclareIncompleteDialog } = useDialog();
  const { showSuccess, showError } = useToast();
  const [collapsed, setCollapsed] = useState(false);

  const [federalStartDate, setFederalStartDate] = useState<string>(fedCommentStartDate ?? "");
  const [federalEndDate, setFederalEndDate] = useState<string>(fedCommentEndDate ?? "");
  const [stateDeemedComplete, setStateDeemedComplete] = useState<string>(
    stateDeemedCompleteDate ?? ""
  );

  const [completenessDocs] = useState<ApplicationWorkflowDocument[]>(
    applicationCompletenessDocument
  );

  const { setApplicationDate } = useSetApplicationDate();

  const { setPhaseStatus: completeCompletenessPhase } = useSetPhaseStatus({
    applicationId: applicationId,
    phaseName: "Completeness",
    phaseStatus: "Completed",
  });

  const { setPhaseStatus: setCompletenessIncompleted } = useSetPhaseStatus({
    applicationId: applicationId,
    phaseName: "Completeness",
    phaseStatus: "Incomplete",
  });

  // Automatically set federal comment period dates based on state deemed complete date
  useEffect(() => {
    if (!stateDeemedComplete) {
      setFederalStartDate("");
      setFederalEndDate("");
      return;
    }

    const parsedStateDate = parseISO(stateDeemedComplete);
    const computedStartDate = addDays(parsedStateDate, 1);
    const computedEndDate = addDays(computedStartDate, FEDERAL_COMMENT_PERIOD_DAYS);

    const nextStart = formatDateForServer(computedStartDate);
    const nextEnd = formatDateForServer(computedEndDate);

    setFederalStartDate(nextStart);
    setFederalEndDate(nextEnd);
  }, [stateDeemedComplete]);

  const finishIsEnabled = () => {
    const datesFilled = Boolean(stateDeemedComplete && federalStartDate && federalEndDate);
    const datesAreValid =
      federalStartDate && federalEndDate
        ? true
        : new Date(federalStartDate) <= new Date(federalEndDate);

    return completenessDocs.length > 0 && datesFilled && datesAreValid;
  };

  const getDateValues = (): Partial<Record<CompletenessPhaseDateType, string>> => {
    return {
      ...(stateDeemedComplete && { "State Application Deemed Complete": stateDeemedComplete }),
      ...(federalStartDate && { "Federal Comment Period Start Date": federalStartDate }),
      ...(federalEndDate && { "Federal Comment Period End Date": federalEndDate }),
      ...(hasApplicationIntakeCompletionDate &&
        stateDeemedComplete && { "Completeness Completion Date": stateDeemedComplete }),
    };
  };

  const saveDates = async () => {
    const inputs = getInputsForCompletenessPhase(applicationId, getDateValues());

    try {
      for (const input of inputs) {
        await setApplicationDate(input);
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : String(error));
      console.error("Error saving Phase: ", error);
    }
  };

  const handleFinishCompleteness = async () => {
    await saveDates();
    await completeCompletenessPhase();
  };

  const UploadSection = () => (
    <div aria-labelledby="completeness-upload-title">
      <h4 id="completeness-upload-title" className={STYLES.title}>
        STEP 1 - UPLOAD
      </h4>
      <p className={STYLES.helper}>Upload the Signed Completeness Letter</p>
      <SecondaryButton
        onClick={() => {
          showCompletenessDocumentUploadDialog(applicationId);
        }}
        size="small"
        name="open-upload"
      >
        Upload
        <ExportIcon />
      </SecondaryButton>
      <DocumentList documents={completenessDocs} />
    </div>
  );

  const VerifyCompleteSection = () => (
    <div aria-labelledby="completeness-verify-title">
      <h4 id="completeness-verify-title" className={STYLES.title}>
        Step 2 - VERIFY/COMPLETE
      </h4>
      <p className={STYLES.helper}>
        Verify that the document(s) are uploaded/accurate and that all required fields are filled.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label
            className="block text-sm font-bold mb-1"
            htmlFor="state-application-deemed-complete"
          >
            <span className="text-text-warn mr-1">*</span>
            State Application Deemed Complete
          </label>
          <input
            type="date"
            value={stateDeemedComplete}
            onChange={(event) => {
              setStateDeemedComplete(event.target.value);
            }}
            className="w-full border border-border-fields px-1 py-1 text-sm rounded"
            id="state-application-deemed-complete"
            data-testid="state-application-deemed-complete"
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-1" htmlFor="federal-comment-period-start">
            <span className="text-text-warn mr-1">*</span>
            Federal Comment Period Start Date
          </label>
          <input
            type="date"
            value={federalStartDate}
            className="w-full border border-border-fields px-1 py-1 text-sm rounded"
            id="federal-comment-period-start"
            data-testid="federal-comment-period-start"
            readOnly
            disabled
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-1" htmlFor="federal-comment-period-end">
            <span className="text-text-warn mr-1">*</span>
            Federal Comment Period End Date
          </label>
          <input
            type="date"
            value={federalEndDate}
            className="w-full border border-border-fields px-1 py-1 text-sm rounded"
            id="federal-comment-period-end"
            data-testid="federal-comment-period-end"
            readOnly
            disabled
          />
        </div>
      </div>

      <div className={STYLES.actions}>
        <SecondaryButton
          name="declare-incomplete"
          size="small"
          onClick={() =>
            showDeclareIncompleteDialog(async () => {
              try {
                await setCompletenessIncompleted();
                showSuccess(PHASE_SAVED_SUCCESS_MESSAGE);
              } catch (error) {
                showError(error instanceof Error ? error.message : String(error));
              }
            })
          }
        >
          Declare Incomplete
        </SecondaryButton>
        <div className={STYLES.actionsEnd}>
          <SecondaryButton
            name="save-for-later"
            size="small"
            onClick={async () => {
              await saveDates();
              showSuccess(DATES_SUCCESS_MESSAGE);
            }}
          >
            Save For Later
          </SecondaryButton>
          <Button
            name="finish-completeness"
            size="small"
            disabled={!finishIsEnabled()}
            onClick={async () => {
              await handleFinishCompleteness();
              showSuccess(PHASE_SAVED_SUCCESS_MESSAGE);
            }}
          >
            Finish
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {fedCommentEndDate && (
        <DueDateNotice
          dueDate={fedCommentEndDate}
          phaseComplete={fedCommentComplete}
          shouldPhaseBeAutomaticallyDismissedIfPhaseIsComplete={false}
          descriptionToAppendDateTo="his Amendment must be declared complete by"
        />
      )}
      <button
        className="flex items-center gap-2 mb-2 text-brand font-bold text-[22px] tracking-wide focus:outline-none"
        onClick={() => setCollapsed((prev) => !prev)}
        aria-expanded={!collapsed}
        aria-controls="completeness-phase-content"
        data-testid="toggle-completeness"
      >
        COMPLETENESS
      </button>
      {!collapsed && (
        <div id="completeness-phase-content">
          <p className="text-sm text-text-placeholder mb-4">
            Completeness Checklist - Find completeness guidelines online at{" "}
            <a
              className="text-blue-700 underline"
              href="https://www.medicaid.gov"
              target="_blank"
              rel="noreferrer"
            >
              Medicaid.gov.
            </a>
          </p>

          <section className={STYLES.pane}>
            <div className={STYLES.grid}>
              <span aria-hidden className={STYLES.divider} />
              <UploadSection />
              <VerifyCompleteSection />
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
