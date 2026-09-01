import React from "react";
import { Button, SecondaryButton } from "components/button";
import { ChevronRightIcon } from "components/icons";
import { DatePicker } from "components/input/date/DatePicker";
import { MISSING_REQUIRED_SECTIONS_TOOLTIP } from "util/messages";
import type { ApplicationWorkflowDocument } from "components/application";

export const FINISH_BUTTON_NAME = "button-finish-concept";
export const SKIP_BUTTON_NAME = "button-skip-concept";
export const DATE_PICKER_NAME = "datepicker-pre-submission-date";
export const CONCEPT_PHASE_STEP_TWO_DESCRIPTION_NAME = "concept-phase-step-two-description";
export const CONCEPT_PHASE_STEP_TWO_DESCRIPTION_TEXT =
  "Check uploaded files. If needed, correct the Concept Paper submitted date before finishing the phase.";

export const ConceptPhaseVerifyCompleteSection = ({
  documents,
  submittedDate,
  isPhaseFinalized,
  isReadonlyUser,
  isFinishEnabled,
  isSkipEnabled,
  onSubmittedDateChange,
  onFinish,
  onSkip,
  getDateValidationMessage,
}: {
  documents: ApplicationWorkflowDocument[];
  submittedDate: string;
  isPhaseFinalized: boolean;
  isReadonlyUser: boolean;
  isFinishEnabled: boolean;
  isSkipEnabled: boolean;
  onSubmittedDateChange: (date: string) => void;
  onFinish: () => void;
  onSkip: () => void;
  getDateValidationMessage: () => string;
}) => {
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
          onChange={onSubmittedDateChange}
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
