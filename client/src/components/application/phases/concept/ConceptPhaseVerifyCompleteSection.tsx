import React, { useEffect, useState } from "react";
import { useSessionStorage } from "hooks";
import { Button, SecondaryButton } from "components/button";
import { ChevronRightIcon } from "components/icons";
import { DatePicker } from "components/input/date/DatePicker";
import { MISSING_REQUIRED_SECTIONS_TOOLTIP, getPhaseCompletedMessage } from "util/messages";
import { useToast } from "components/toast";
import { useSetApplicationDate } from "components/application/date/dateQueries";
import {
  useCompletePhase,
  useSkipConceptPhase,
} from "components/application/phase-status/phaseCompletionQueries";
import { getCurrentUser, isReadonly } from "components/user/UserContext";
import type { ApplicationWorkflowDocument } from "components/application";
import type { LocalDate, PhaseName, PhaseStatus } from "demos-server";

const CONCEPT_PHASE_NAME: PhaseName = "Concept";
const NEXT_PHASE_NAME: PhaseName = "Application Intake";

export const FINISH_BUTTON_NAME = "button-finish-concept";
export const SKIP_BUTTON_NAME = "button-skip-concept";
export const DATE_PICKER_NAME = "datepicker-pre-submission-date";
export const CONCEPT_PHASE_STEP_TWO_DESCRIPTION_NAME = "concept-phase-step-two-description";
export const CONCEPT_PHASE_STEP_TWO_DESCRIPTION_TEXT =
  "Check uploaded files. If needed, correct the Concept Paper submitted date before finishing the phase";

export const ConceptPhaseVerifyCompleteSection = ({
  applicationId,
  documents,
  initialPresubmissionSubmittedDate,
  phaseStatus,
  setSelectedPhase,
}: {
  applicationId: string;
  documents: ApplicationWorkflowDocument[];
  initialPresubmissionSubmittedDate?: string;
  phaseStatus: PhaseStatus;
  setSelectedPhase: (phase: PhaseName) => void;
}) => {
  const { showSuccess } = useToast();
  const { setApplicationDate } = useSetApplicationDate();
  const { completePhase } = useCompletePhase();
  const { skipConceptPhase } = useSkipConceptPhase();
  const { currentUser } = getCurrentUser();

  const isPhaseFinalized = phaseStatus === "Completed" || phaseStatus === "Skipped";
  const isReadonlyUser = isReadonly(currentUser);

  // User can override the calculated date via the datepicker
  const [userSubmittedDateOverride, setUserSubmittedDateOverride] = useSessionStorage(
    `concept-phase-submitted-date-${applicationId}`
  );
  const [isFinishEnabled, setIsFinishEnabled] = useState<boolean>(false);
  const [isSkipEnabled, setIsSkipEnabled] = useState<boolean>(true);

  // Use override if it exists, otherwise use initial date
  const submittedDate = userSubmittedDateOverride || (initialPresubmissionSubmittedDate ?? "");

  useEffect(() => {
    const finishShouldBeEnabled =
      !isPhaseFinalized &&
      documents.filter((document) => document.documentType === "Pre-Submission").length > 0 &&
      !!submittedDate;

    setIsFinishEnabled(finishShouldBeEnabled);
    setIsSkipEnabled(!finishShouldBeEnabled && !isPhaseFinalized);
  }, [submittedDate, documents, isPhaseFinalized]);

  const getDateValidationMessage = (): string => {
    if (
      documents.filter((document) => document.documentType === "Pre-Submission").length > 0 &&
      !submittedDate
    ) {
      return "Date is required when documents are uploaded";
    } else if (documents.length === 0 && submittedDate) {
      return "At least one Pre-Submission document is required when date is provided";
    }
    return "";
  };

  const onFinish = async () => {
    if (!submittedDate) {
      console.error("Submitted date is required before finishing Concept phase.");
      return;
    }

    try {
      await setApplicationDate({
        applicationId: applicationId,
        dateType: "Concept Paper Submitted Date",
        dateValue: submittedDate as LocalDate,
      });
    } catch (error) {
      console.error("Error setting application date:", error);
      return;
    }

    try {
      await completePhase({
        applicationId: applicationId,
        phaseName: CONCEPT_PHASE_NAME,
      });
    } catch (error) {
      console.error("Error completing concept phase:", error);
      return;
    }

    showSuccess(getPhaseCompletedMessage(CONCEPT_PHASE_NAME));
    setSelectedPhase(NEXT_PHASE_NAME);
  };

  const onSkip = async () => {
    try {
      await skipConceptPhase(applicationId);
    } catch (error) {
      console.error("Error skipping concept phase:", error);
      return;
    }

    showSuccess("Concept phase skipped");
    setSelectedPhase(NEXT_PHASE_NAME);
  };
  return (
    <div aria-labelledby="concept-verify-title">
      <h4 id="concept-verify-title" className="text-xl font-semibold mb-1 uppercase">
        Step 2 - Verify/Complete
      </h4>
      <p
        data-testid={CONCEPT_PHASE_STEP_TWO_DESCRIPTION_NAME}
        className="text-sm text-text-placeholder mb-2"
      >
        {CONCEPT_PHASE_STEP_TWO_DESCRIPTION_TEXT}
      </p>

      <div className="space-y-4">
        <DatePicker
          name={DATE_PICKER_NAME}
          label={"Concept Paper Submitted Date"}
          value={submittedDate}
          onChange={setUserSubmittedDateOverride}
          isRequired={documents.length > 0}
          getValidationMessage={getDateValidationMessage}
          isDisabled={isPhaseFinalized || isReadonlyUser}
        />
      </div>

      <div className="mt-8 flex justify-end gap-3">
        <SecondaryButton
          isHidden={isReadonlyUser}
          name={SKIP_BUTTON_NAME}
          aria-label="Skip this section"
          onClick={onSkip}
          disabled={!isSkipEnabled}
        >
          Skip
          <ChevronRightIcon />
        </SecondaryButton>
        <Button
          isHidden={isReadonlyUser}
          name={FINISH_BUTTON_NAME}
          aria-label="Finish this section"
          onClick={onFinish}
          disabled={!isFinishEnabled}
          eagerTooltip={
            !isFinishEnabled && !isPhaseFinalized ? MISSING_REQUIRED_SECTIONS_TOOLTIP : undefined
          }
        >
          Finish
        </Button>
      </div>
    </div>
  );
};
