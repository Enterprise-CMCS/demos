import { DatePicker } from "components/input/date/DatePicker";
import React from "react";
import { isBefore, parseISO } from "date-fns";
import { formatDate, getTodayEst } from "util/formatDate";

export const SINGLE_DELIVERABLE_DUE_DATE_NAME = "single-deliverable-due-date";

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
          minDate={today}
          getValidationMessage={() =>
            value && isBefore(value, today)
              ? `Date must be on or after ${formatDate(parseISO(today))}.`
              : ""
          }
        />
      </div>
    </div>
  );
};
