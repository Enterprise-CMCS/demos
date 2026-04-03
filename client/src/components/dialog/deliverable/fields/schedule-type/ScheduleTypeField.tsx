import React from "react";

import { AutoCompleteSelect } from "components/input/select/AutoCompleteSelect";

export const ALL_SCHEDULE_TYPES: string[] = ["Single", "Quarterly"];
export type ScheduleType = (typeof ALL_SCHEDULE_TYPES)[number];

export interface QuarterlyDeliverableSchedule {
  q1DueDate: string;
  q2DueDate: string;
  q3DueDate: string;
  q4DueDate: string;
}

export interface SingleDeliverableSchedule {
  dueDate: string;
}

export type DeliverableSchedule = QuarterlyDeliverableSchedule | SingleDeliverableSchedule;

export const ScheduleTypeField = ({
  value,
  onSelect,
}: {
  value: ScheduleType;
  onSelect: (value: ScheduleType) => void;
}) => {
  return (
    <AutoCompleteSelect
      id="schedule-type"
      dataTestId="select-schedule-type"
      label="Schedule Type"
      options={ALL_SCHEDULE_TYPES.map((type) => ({ label: type, value: type }))}
      value={value}
      onSelect={onSelect}
      isRequired
      placeholder="Select..."
    />
  );
};
