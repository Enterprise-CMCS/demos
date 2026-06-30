import React from "react";

import { Button, SecondaryButton } from "components/button";
import { DateType } from "demos-server";
import { DatePicker } from "components/input/date/DatePicker";
import {
  COMPLETENESS_DECLARE_INCOMPLETE_BUTTON_NAME,
  COMPLETENESS_FINISH_BUTTON_NAME,
  COMPLETENESS_PHASE_STEP_TWO_DESCRIPTION,
  FEDERAL_COMMENT_END_DATEPICKER_NAME,
  FEDERAL_COMMENT_START_DATEPICKER_NAME,
  STATE_DEEMED_COMPLETE_DATEPICKER_NAME,
} from "./CompletenessPhase";

export const VerifyCompleteSection = ({
  stateDeemedComplete,
  federalStartDate,
  federalEndDate,
  completenessComplete,
  finishIsEnabled,
  onDateChange,
  onDeclareIncomplete,
  onFinish,
}: {
  stateDeemedComplete: string;
  federalStartDate: string;
  federalEndDate: string;
  completenessComplete: boolean;
  finishIsEnabled: boolean;
  onDateChange: (date: string) => void;
  onDeclareIncomplete: () => void;
  onFinish: () => void;
}) => (
  <div aria-labelledby="completeness-verify-title">
    <h4 id="completeness-verify-title" className="text-xl font-semibold mb-2 uppercase">
      Step 2 - Verify/Complete
    </h4>
    <p
      className={"text-sm text-text-placeholder mb-2"}
      data-testId={COMPLETENESS_PHASE_STEP_TWO_DESCRIPTION.testId}
    >
      {COMPLETENESS_PHASE_STEP_TWO_DESCRIPTION.text}
    </p>

    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <DatePicker
          name={STATE_DEEMED_COMPLETE_DATEPICKER_NAME}
          label={"State Application Deemed Complete" satisfies DateType}
          value={stateDeemedComplete}
          onChange={onDateChange}
          isDisabled={completenessComplete}
        />
      </div>

      <div>
        <DatePicker
          name={FEDERAL_COMMENT_START_DATEPICKER_NAME}
          label={"Federal Comment Period Start Date" satisfies DateType}
          value={federalStartDate}
          isDisabled
        />
      </div>

      <div>
        <DatePicker
          name={FEDERAL_COMMENT_END_DATEPICKER_NAME}
          label={"Federal Comment Period End Date" satisfies DateType}
          value={federalEndDate}
          isDisabled
        />
      </div>
    </div>

    <div className={"mt-8 flex justify-end gap-2"}>
      <SecondaryButton
        name={COMPLETENESS_DECLARE_INCOMPLETE_BUTTON_NAME}
        size="small"
        onClick={onDeclareIncomplete}
        disabled={completenessComplete}
      >
        Declare Incomplete
      </SecondaryButton>
      <Button
        name={COMPLETENESS_FINISH_BUTTON_NAME}
        size="small"
        disabled={!finishIsEnabled}
        onClick={onFinish}
      >
        Finish
      </Button>
    </div>
  </div>
);
