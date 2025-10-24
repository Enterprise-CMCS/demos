import React, { useCallback, useMemo, useState, useEffect } from "react";

import { gql, useApolloClient, useMutation } from "@apollo/client";
import { addDays, differenceInCalendarDays } from "date-fns";
import { TZDate } from "@date-fns/tz";

import { Button, SecondaryButton } from "components/button";
import { ExportIcon } from "components/icons";
import { Notice, NoticeVariant } from "components/notice";
import { DeclareIncompleteDialog } from "components/dialog";
import { CompletenessDocumentUploadDialog } from "./CompletenessDocumentUploadDialog";
import { DocumentTableDocument } from "components/table/tables/DocumentTable";
import { DemonstrationPhase } from "pages/DemonstrationDetail/DemonstrationDetail";
import {
  DateType,
  DocumentType,
  PhaseStatus,
  SetApplicationDateInput,
  SetPhaseStateInput,
} from "demos-server";
import { UPDATE_DEMONSTRATION_MUTATION } from "components/dialog/demonstration/EditDemonstrationDialog";
import {
  getEndOfDayEST,
  getStartOfDayEST,
} from "components/application/dates/applicationDates";
import { formatDate, formatDateForServer, parseInputDate } from "util/formatDate";
import { tw } from "tags/tw";

const SET_APPLICATION_DATE_MUTATION = gql`
  mutation SetApplicationDate($input: SetApplicationDateInput!) {
    setApplicationDate(input: $input) {
      __typename
      ... on Demonstration {
        id
      }
      ... on Amendment {
        id
      }
      ... on Extension {
        id
      }
    }
  }
`;

const SET_PHASE_STATE_MUTATION = gql`
  mutation SetPhaseState($input: SetPhaseStateInput!) {
    setPhaseState(input: $input) {
      phaseName
      phaseStatus
      updatedAt
    }
  }
`;

const COMPLETENESS_DOCUMENT_TYPES: DocumentType[] = ["Application Completeness Letter"];
const REFETCH_QUERIES = ["DemonstrationDetailQuery"];

const STYLES = {
  pane: tw`bg-white`,
  grid: tw`relative grid grid-cols-2 gap-10`,
  divider: tw`pointer-events-none absolute left-1/2 top-0 h-full border-l border-border-subtle`,
  stepEyebrow: tw`text-xs font-semibold uppercase tracking-wide text-text-placeholder mb-2`,
  title: tw`text-xl font-semibold mb-2`,
  helper: tw`text-sm text-text-placeholder mb-2`,
  list: tw`mt-4 space-y-3`,
  fileRow: tw`bg-surface-secondary border border-border-fields px-3 py-2 flex items-center justify-between`,
  fileMeta: tw`text-xs text-text-placeholder mt-0.5`,
  actions: tw`mt-8 flex items-center gap-3`,
  actionsEnd: tw`ml-auto flex gap-3`,
};

const formatInputValue = (date: Date | null | undefined): string =>
  date ? formatDateForServer(date) : "";

const parseInputToStartOfDayEST = (value: string): Date | null => {
  if (!value) return null;
  const parsed = parseInputDate(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return getStartOfDayEST(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

const parseInputToEndOfDayEST = (value: string): Date | null => {
  if (!value) return null;
  const parsed = parseInputDate(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return getEndOfDayEST(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

const toDate = (value: Date | string | null | undefined): Date | null => {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const findPhaseDateValue = (
  phase: DemonstrationPhase | undefined,
  dateType: DateType
): Date | null => {
  const match = phase?.phaseDates.find((date) => date.dateType === dateType);
  return match ? toDate(match.dateValue) : null;
};

const CompletenessNotice = ({ dueDate }: { dueDate: Date | null }) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (!dueDate || isDismissed) {
    return null;
  }

  const today = new Date();
  const daysRemaining = differenceInCalendarDays(dueDate, today);
  const variant: NoticeVariant = daysRemaining <= 1 ? "error" : "warning";

  const title =
    daysRemaining < 0
      ? `${Math.abs(daysRemaining)} Day${Math.abs(daysRemaining) === 1 ? "" : "s"} Past Due`
      : `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} left in Federal Comment Period`;

  const description = `This phase must be declared complete by ${formatDate(dueDate)}.`;

  return (
    <Notice
      variant={variant}
      title={title}
      description={description}
      onDismiss={() => setIsDismissed(true)}
      className="mb-6"
    />
  );
};

type CompletenessPhaseProps = {
  demonstrationId: string;
  completenessPhase?: DemonstrationPhase;
  applicationIntakePhaseStatus?: PhaseStatus | null;
  documents: DocumentTableDocument[];
  onPhaseFinished?: () => void;
};

export const CompletenessPhase: React.FC<CompletenessPhaseProps> = ({
  demonstrationId,
  completenessPhase,
  applicationIntakePhaseStatus,
  documents,
  onPhaseFinished,
}) => {
  const client = useApolloClient();
  const [setApplicationDate] = useMutation(SET_APPLICATION_DATE_MUTATION);
  const [setPhaseState] = useMutation(SET_PHASE_STATE_MUTATION);
  const [updateDemonstration] = useMutation(UPDATE_DEMONSTRATION_MUTATION);

  const [isUploadOpen, setUploadOpen] = useState(false);
  const [isDeclareIncompleteOpen, setDeclareIncompleteOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const completenessDocuments = useMemo(
    () => documents.filter((doc) => COMPLETENESS_DOCUMENT_TYPES.includes(doc.documentType)),
    [documents]
  );

  const completenessReviewDueDate = useMemo(
    () => findPhaseDateValue(completenessPhase, "Completeness Review Due Date"),
    [completenessPhase]
  );

  const stateDeemedCompleteDate = useMemo(
    () => findPhaseDateValue(completenessPhase, "State Application Deemed Complete"),
    [completenessPhase]
  );
  const stateTimestamp = stateDeemedCompleteDate?.getTime();

  const federalCommentStartDate = useMemo(
    () => findPhaseDateValue(completenessPhase, "Federal Comment Period Start Date"),
    [completenessPhase]
  );
  const federalStartTimestamp = federalCommentStartDate?.getTime();

  const federalCommentEndDate = useMemo(
    () => findPhaseDateValue(completenessPhase, "Federal Comment Period End Date"),
    [completenessPhase]
  );
  const federalEndTimestamp = federalCommentEndDate?.getTime();

  const [stateDeemedCompleteInput, setStateDeemedCompleteInput] = useState(() =>
    formatInputValue(stateDeemedCompleteDate)
  );
  const [federalStartInput, setFederalStartInput] = useState(() =>
    formatInputValue(federalCommentStartDate)
  );
  const [federalEndInput, setFederalEndInput] = useState(() =>
    formatInputValue(federalCommentEndDate)
  );

  useEffect(() => {
    setStateDeemedCompleteInput(formatInputValue(stateDeemedCompleteDate));
  }, [stateTimestamp]);

  useEffect(() => {
    setFederalStartInput(formatInputValue(federalCommentStartDate));
  }, [federalStartTimestamp]);

  useEffect(() => {
    setFederalEndInput(formatInputValue(federalCommentEndDate));
  }, [federalEndTimestamp]);

  const handleStateDateChange = useCallback((value: string) => {
    setStateDeemedCompleteInput(value);
    if (!value) {
      setFederalStartInput("");
      setFederalEndInput("");
      return;
    }

    const parsed = parseInputToStartOfDayEST(value);
    if (!parsed) {
      setFederalStartInput("");
      setFederalEndInput("");
      return;
    }

    const nextDay = addDays(parsed, 1);
    setFederalStartInput(formatInputValue(nextDay));

    const thirtyDaysLater = addDays(nextDay, 30);
    const autoEnd = getEndOfDayEST(
      thirtyDaysLater.getFullYear(),
      thirtyDaysLater.getMonth(),
      thirtyDaysLater.getDate()
    );
    setFederalEndInput(formatInputValue(autoEnd));
  }, []);

  const stateDeemedCompleteForSubmission = parseInputToStartOfDayEST(stateDeemedCompleteInput);
  const federalCommentStartForSubmission = parseInputToStartOfDayEST(federalStartInput);
  const federalCommentEndForSubmission = parseInputToEndOfDayEST(federalEndInput);

  const datesFilled =
    Boolean(stateDeemedCompleteInput) && Boolean(federalStartInput) && Boolean(federalEndInput);
  const startAfterState =
    stateDeemedCompleteForSubmission && federalCommentStartForSubmission
      ? federalCommentStartForSubmission.getTime() > stateDeemedCompleteForSubmission.getTime()
      : true;
  const endAfterStart =
    federalCommentStartForSubmission && federalCommentEndForSubmission
      ? federalCommentEndForSubmission.getTime() >= federalCommentStartForSubmission.getTime()
      : true;

  const datesAreValid = datesFilled && startAfterState && endAfterStart;
  const hasRequiredDocument = completenessDocuments.length > 0;
  const applicationIntakeCompleted = applicationIntakePhaseStatus === "Completed";

  const canFinish =
    !isSubmitting && applicationIntakeCompleted && hasRequiredDocument && datesAreValid;

  const persistApplicationDates = useCallback(
    async (dateInputs: SetApplicationDateInput[]) => {
      for (const input of dateInputs) {
        await setApplicationDate({
          variables: { input },
        });
      }
    },
    [setApplicationDate]
  );

  const persistPhaseStates = useCallback(
    async (phaseInputs: SetPhaseStateInput[]) => {
      for (const input of phaseInputs) {
        await setPhaseState({
          variables: { input },
        });
      }
    },
    [setPhaseState]
  );

  const handleFinish = useCallback(async () => {
    if (
      !stateDeemedCompleteForSubmission ||
      !federalCommentStartForSubmission ||
      !federalCommentEndForSubmission
    ) {
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const nowInEst = new TZDate(new Date(), "America/New_York");
      const completionDate = getStartOfDayEST(
        nowInEst.getFullYear(),
        nowInEst.getMonth(),
        nowInEst.getDate()
      );

      const dateInputs: SetApplicationDateInput[] = [
        {
          applicationId: demonstrationId,
          dateType: "State Application Deemed Complete",
          dateValue: stateDeemedCompleteForSubmission,
        },
        {
          applicationId: demonstrationId,
          dateType: "Federal Comment Period Start Date",
          dateValue: federalCommentStartForSubmission,
        },
        {
          applicationId: demonstrationId,
          dateType: "Federal Comment Period End Date",
          dateValue: federalCommentEndForSubmission,
        },
        {
          applicationId: demonstrationId,
          dateType: "Completeness Completion Date",
          dateValue: completionDate,
        },
      ];

      await persistApplicationDates(dateInputs);

      const phaseInputs: SetPhaseStateInput[] = [
        {
          applicationId: demonstrationId,
          phaseName: "Completeness",
          phaseStatus: "Completed",
        },
        {
          applicationId: demonstrationId,
          phaseName: "Federal Comment",
          phaseStatus: "Started",
        },
      ];

      await persistPhaseStates(phaseInputs);

      await updateDemonstration({
        variables: {
          id: demonstrationId,
          input: { currentPhaseName: "Federal Comment" },
        },
      });

      await client.refetchQueries({
        include: REFETCH_QUERIES,
      });

      onPhaseFinished?.();
    } catch (error) {
      setSubmissionError(
        error instanceof Error ? error.message : "Unable to finish the Completeness phase."
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    client,
    demonstrationId,
    federalCommentEndForSubmission,
    federalCommentStartForSubmission,
    onPhaseFinished,
    persistApplicationDates,
    persistPhaseStates,
    stateDeemedCompleteForSubmission,
    updateDemonstration,
  ]);

  const UploadSection = () => (
    <div aria-labelledby="completeness-upload-title">
      <h4 id="completeness-upload-title" className={STYLES.title}>
        STEP 1 - UPLOAD
      </h4>
      <p className={STYLES.helper}>Upload the signed Completeness Letter.</p>

      <SecondaryButton onClick={() => setUploadOpen(true)} size="small" name="open-upload">
        Upload
        <ExportIcon />
      </SecondaryButton>

      <div className={STYLES.list}>
        {completenessDocuments.map((doc) => {
          const createdAtDate = toDate(doc.createdAt);
          return (
            <div key={doc.id} className={STYLES.fileRow}>
              <div>
                <div className="font-medium">{doc.name}</div>
                <div className={STYLES.fileMeta}>
                  {createdAtDate ? formatDate(createdAtDate) : "--/--/----"}
                </div>
              </div>
            </div>
          );
        })}
        {completenessDocuments.length === 0 && (
          <div className="text-sm text-text-placeholder">
            No completeness documents uploaded yet.
          </div>
        )}
      </div>
    </div>
  );

  const VerifyCompleteSection = () => (
    <div aria-labelledby="completeness-verify-title">
      <div className={STYLES.stepEyebrow}>Step 2 - Verify/Complete</div>
      <h4 id="completeness-verify-title" className={STYLES.title}>
        VERIFY/COMPLETE
      </h4>
      <p className={STYLES.helper}>
        Verify that the uploaded documents are accurate and all required dates are populated.
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
            value={stateDeemedCompleteInput}
            onChange={(e) => handleStateDateChange(e.target.value)}
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
            value={federalStartInput}
            onChange={(e) => setFederalStartInput(e.target.value)}
            className="w-full border border-border-fields px-1 py-1 text-sm rounded"
            id="federal-comment-period-start"
            data-testid="federal-comment-period-start"
          />
          {datesFilled && !startAfterState && (
            <div className="text-xs text-text-warn mt-1">
              Start date must be after the State Application Deemed Complete date.
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold mb-1" htmlFor="federal-comment-period-end">
            <span className="text-text-warn mr-1">*</span>
            Federal Comment Period End Date
          </label>
          <input
            type="date"
            value={federalEndInput}
            onChange={(e) => setFederalEndInput(e.target.value)}
            className="w-full border border-border-fields px-1 py-1 text-sm rounded"
            id="federal-comment-period-end"
            data-testid="federal-comment-period-end"
          />
          {datesFilled && !endAfterStart && (
            <div className="text-xs text-text-warn mt-1">End date must be after start date.</div>
          )}
        </div>
      </div>

      <div className={STYLES.actions}>
        <SecondaryButton
          name="declare-incomplete"
          size="small"
          onClick={() => setDeclareIncompleteOpen(true)}
        >
          Declare Incomplete
        </SecondaryButton>
        <div className={STYLES.actionsEnd}>
          <SecondaryButton
            name="save-for-later"
            size="small"
            onClick={() => console.log("Saved draft of completeness phase")}
          >
            Save For Later
          </SecondaryButton>
          <Button
            name="finish-completeness"
            size="small"
            disabled={!canFinish}
            onClick={handleFinish}
          >
            {isSubmitting ? "Finishing..." : "Finish"}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <CompletenessNotice dueDate={completenessReviewDueDate} />
      {submissionError && (
        <Notice
          variant="error"
          title="Unable to finish Completeness phase"
          description={submissionError}
          className="mb-4"
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
            Completeness Checklist – Find completeness guidelines online at{" "}
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

          <CompletenessDocumentUploadDialog
            isOpen={isUploadOpen}
            onClose={() => setUploadOpen(false)}
            applicationId={demonstrationId}
            refetchQueries={[...REFETCH_QUERIES]}
          />
          <DeclareIncompleteDialog
            isOpen={isDeclareIncompleteOpen}
            onClose={() => setDeclareIncompleteOpen(false)}
            onConfirm={(form) => console.log("Declare incomplete submitted", form)}
          />
        </div>
      )}
    </div>
  );
};
