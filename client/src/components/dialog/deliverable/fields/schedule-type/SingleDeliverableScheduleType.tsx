import { DatePicker } from "components/input/date/DatePicker";
import React from "react";

export const SINGLE_DELIVERABLE_DUE_DATE_NAME = "single-deliverable-due-date";

export const SingleDeliverableScheduleType = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (dueDate: string) => void;
}) => {
  return (
    <div className="grid grid-cols-2">
      <div className="col-span-1">
        <DatePicker
          name={SINGLE_DELIVERABLE_DUE_DATE_NAME}
          label="Due Date"
          value={value}
          onChange={onChange}
          isRequired={true}
        />
      </div>
    </div>
  );
};
