import React from "react";

import { AutoCompleteSelect } from "components/input/select/AutoCompleteSelect";

export const SCHEDULE_TYPES = ["Single", "Quarterly"] as const;
const SCHEDULE_TYPE_OPTIONS = SCHEDULE_TYPES.map((type) => ({ label: type, value: type }));

export const ScheduleTypeField = ({
  value,
  onSelect,
  isDisabled = false,
}: {
  value: string;
  onSelect: (value: string) => void;
  isDisabled?: boolean;
}) => {
  return (
    <AutoCompleteSelect
      id="schedule-type"
      dataTestId="select-schedule-type"
      label="Schedule Type"
      options={SCHEDULE_TYPE_OPTIONS}
      value={value}
      onSelect={onSelect}
      isRequired
      isDisabled={isDisabled}
      placeholder="Select schedule type…"
    />
  );
};
