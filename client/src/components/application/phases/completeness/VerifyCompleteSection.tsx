import React, { useState } from "react";

import { Button, SecondaryButton } from "components/button";
import { DatePicker } from "components/input/date/DatePicker";
import { ApplicationWorkflowDocument } from "components/application";
import { useToast } from "components/toast";
import { useDialog } from "components/dialog/DialogContext";
import { useSetApplicationDates } from "components/application/date/dateQueries";
import {
  useCompletePhase,
  useDeclareCompletenessPhaseIncomplete,
} from "components/application/phase-status/phaseCompletionQueries";
import { formatDateForServer, getDateEst } from "util/formatDate";
import { addDays, parseISO } from "date-fns";
import { ApplicationDateInput, LocalDate, PhaseName, PhaseStatus } from "demos-server";
import {
  getPhaseCompletedMessage,
  MISSING_REQUIRED_SECTIONS_TOOLTIP,
  SAVE_FOR_LATER_MESSAGE,
} from "util/messages";
import {
  COMPLETENESS_DECLARE_INCOMPLETE_BUTTON_NAME,
  COMPLETENESS_FINISH_BUTTON_NAME,
  COMPLETENESS_PHASE_STEP_TWO_DESCRIPTION,
  FEDERAL_COMMENT_END_DATEPICKER_NAME,
  FEDERAL_COMMENT_START_DATEPICKER_NAME,
  STATE_DEEMED_COMPLETE_DATEPICKER_NAME,
} from "./CompletenessPhase";

const FEDERAL_COMMENT_PERIOD_DAYS = 30;

const THIS_PHASE_NAME: PhaseName = "Completeness";
const NEXT_PHASE_NAME: PhaseName = "Federal Comment";

const calculateFederalCommentPeriodDates = (
  stateDeemedCompleteDate: string
): { federalStartDate: string; federalEndDate: string } => {
  if (!stateDeemedCompleteDate) return { federalStartDate: "", federalEndDate: "" };

  const parsedStateDeemedCompleteDate = parseISO(stateDeemedCompleteDate);
  const federalStartDate = addDays(parsedStateDeemedCompleteDate, 1);
  const federalEndDate = addDays(parsedStateDeemedCompleteDate, 1 + FEDERAL_COMMENT_PERIOD_DAYS);

  return {
    federalStartDate: formatDateForServer(federalStartDate),
    federalEndDate: formatDateForServer(federalEndDate),
  };
};

const calculateStateDeemedCompleteDate = (
  stateDeemedCompleteDate: string,
  completenessDocuments: ApplicationWorkflowDocument[],
  completenessIncomplete: boolean
): string => {
  if (stateDeemedCompleteDate) return stateDeemedCompleteDate;
  if (completenessIncomplete) return "";
  const applicationCompletenessLetter = completenessDocuments.find(
    (doc) => doc.documentType === "Application Completeness Letter"
  );
  if (!applicationCompletenessLetter) return "";
  return getDateEst(applicationCompletenessLetter.createdAt);
};

export const VerifyCompleteSection = ({
  applicationId,
  stateDeemedCompleteDate,
  completenessPhaseStatus,
  completenessDocuments,
  applicationIntakeComplete,
  setSelectedPhase,
}: {
  applicationId: string;
  stateDeemedCompleteDate: string;
  completenessPhaseStatus: PhaseStatus;
  completenessDocuments: ApplicationWorkflowDocument[];
  applicationIntakeComplete: boolean;
  setSelectedPhase: (phase: PhaseName) => void;
}) => {
  const completenessComplete = completenessPhaseStatus === "Completed";
  const completenessIncomplete = completenessPhaseStatus === "Incomplete";

  const { showDeclareIncompleteDialog } = useDialog();
  const { showSuccess, showError } = useToast();
  const { setApplicationDates } = useSetApplicationDates();
  const { completePhase } = useCompletePhase();
  const { declareCompletenessPhaseIncomplete } = useDeclareCompletenessPhaseIncomplete();

  const [userSelectedStateDeemedCompleteDate, setUserSelectedStateDeemedCompleteDate] =
    useState("");

  const calculatedStateDeemedCompleteDate = calculateStateDeemedCompleteDate(
    stateDeemedCompleteDate,
    completenessDocuments,
    completenessIncomplete
  );
  const stateDeemedComplete =
    userSelectedStateDeemedCompleteDate || calculatedStateDeemedCompleteDate;
  const { federalStartDate, federalEndDate } =
    calculateFederalCommentPeriodDates(stateDeemedComplete);

  const finishIsEnabled = () => {
    const datesFilled = Boolean(stateDeemedComplete && federalStartDate && federalEndDate);
    const datesAreValid =
      federalStartDate && federalEndDate
        ? true
        : new Date(federalStartDate) <= new Date(federalEndDate);

    return (
      !completenessComplete &&
      applicationIntakeComplete &&
      completenessDocuments.find((doc) => doc.documentType === "Application Completeness Letter") &&
      completenessDocuments.find(
        (doc) => doc.documentType === "Internal Completeness Review Form"
      ) &&
      datesFilled &&
      datesAreValid
    );
  };

  const saveDates = async () => {
    const dates: ApplicationDateInput[] = [
      {
        dateType: "State Application Deemed Complete",
        dateValue: stateDeemedComplete as LocalDate,
      },
      {
        dateType: "Federal Comment Period Start Date",
        dateValue: federalStartDate as LocalDate,
      },
      {
        dateType: "Federal Comment Period End Date",
        dateValue: federalEndDate as LocalDate,
      },
    ];

    await setApplicationDates({
      applicationId,
      applicationDates: dates,
    });
  };

  const handleDeclareIncomplete = async () => {
    showDeclareIncompleteDialog(async () => {
      try {
        await declareCompletenessPhaseIncomplete(applicationId);
        setUserSelectedStateDeemedCompleteDate("");
        showSuccess(SAVE_FOR_LATER_MESSAGE);
      } catch (error) {
        showError(error instanceof Error ? error.message : String(error));
      }
    });
  };

  const handleFinishCompleteness = async () => {
    try {
      await saveDates();
      await completePhase({
        applicationId,
        phaseName: THIS_PHASE_NAME,
      });
      showSuccess(getPhaseCompletedMessage(THIS_PHASE_NAME));
      setSelectedPhase(NEXT_PHASE_NAME);
    } catch (e) {
      console.error(e);
      showError(`Failed to complete ${THIS_PHASE_NAME} phase`);
    }
  };

  return (
    <div aria-labelledby="completeness-verify-title">
      <h4 id="completeness-verify-title" className="text-xl font-semibold mb-2 uppercase">
        Step 2 - Verify/Complete
      </h4>
      <p
        className={"text-sm text-text-placeholder mb-2"}
        data-testid={COMPLETENESS_PHASE_STEP_TWO_DESCRIPTION.testId}
      >
        {COMPLETENESS_PHASE_STEP_TWO_DESCRIPTION.text}
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <DatePicker
            name={STATE_DEEMED_COMPLETE_DATEPICKER_NAME}
            label={"State Application Deemed Complete"}
            value={stateDeemedComplete}
            onChange={setUserSelectedStateDeemedCompleteDate}
            isDisabled={completenessComplete}
          />
        </div>

        <div>
          <DatePicker
            name={FEDERAL_COMMENT_START_DATEPICKER_NAME}
            label={"Federal Comment Period Start Date"}
            value={federalStartDate}
            isDisabled
          />
        </div>

        <div>
          <DatePicker
            name={FEDERAL_COMMENT_END_DATEPICKER_NAME}
            label={"Federal Comment Period End Date"}
            value={federalEndDate}
            isDisabled
          />
        </div>
      </div>

      <div className={"mt-8 flex justify-end gap-2"}>
        <SecondaryButton
          name={COMPLETENESS_DECLARE_INCOMPLETE_BUTTON_NAME}
          size="small"
          onClick={handleDeclareIncomplete}
          disabled={completenessComplete}
        >
          Declare Incomplete
        </SecondaryButton>
        <Button
          name={COMPLETENESS_FINISH_BUTTON_NAME}
          size="small"
          disabled={!finishIsEnabled()}
          onClick={handleFinishCompleteness}
          eagerTooltip={
            !finishIsEnabled() && !completenessComplete
              ? MISSING_REQUIRED_SECTIONS_TOOLTIP
              : undefined
          }
        >
          Finish
        </Button>
      </div>
    </div>
  );
};
