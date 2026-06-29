import { DatePicker } from "components/input/date/DatePicker";
import React from "react";
import { isBefore } from "date-fns";
import { getTodayEst } from "util/formatDate";

export const SINGLE_DELIVERABLE_DUE_DATE_NAME = "single-deliverable-due-date";
const DATE_IN_PAST_MESSAGE = "Date cannot be in the past";

export const SingleDeliverableScheduleType = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (dueDate: string) => void;
}) => {
  const today = getTodayEst();
  return (
    <div className="grid grid-cols-2">
      <div className="col-span-1">
        <DatePicker
          name={SINGLE_DELIVERABLE_DUE_DATE_NAME}
          label="Due Date"
          value={value}
          onChange={onChange}
          isRequired={true}
          getValidationMessage={() =>
            value && isBefore(value, today) ? DATE_IN_PAST_MESSAGE : ""
          }
        />
      </div>
    </div>
  );
};
