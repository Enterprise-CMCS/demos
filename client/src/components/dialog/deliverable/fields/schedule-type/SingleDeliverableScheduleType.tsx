import { DatePicker } from "components/input/date/DatePicker";
import React, { useState } from "react";

const SINGLE_DELIVERABLE_DUE_DATE_NAME = "single-deliverable-due-date";

export const SingleDeliverableScheduleType = () => {
  const [dueDate, setDueDate] = useState<string>("");

  return (
    <div className="grid grid-cols-2">
      <div className="col-span-1">
        <DatePicker
          name={SINGLE_DELIVERABLE_DUE_DATE_NAME}
          label="Due Date"
          value={dueDate}
          onChange={(newDate: string) => setDueDate(newDate)}
          isRequired={true}
        />
      </div>
    </div>
  );
};
