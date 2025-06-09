import React from "react";
import { AutoCompleteSelect } from "./AutoCompleteSelect";
import statuses from "faker_data/demonstrationStatuses.json";

export interface DemonstrationStatus {
  id: number;
  name: string;
  deletedAt: Date | null;
  createdAt: string;
  updatedAt: string;
}

interface SelectDemoStatusesProps {
  onStatusChange: (status: string) => void;
  isRequired?: boolean;
  isDisabled?: boolean;
}

export const SelectDemoStatuses: React.FC<SelectDemoStatusesProps> = ({
  onStatusChange,
  isRequired = false,
  isDisabled = false,
}) => {
  // Define the Option type for the select options
  interface Option {
    label: string;
    value: string;
  }
  // Map each JSON object into { label, value } pairs:
  const options: Option[] = (statuses as DemonstrationStatus[]).map((s) => ({
    label: s.name,
    value: s.name,   // parent will receive the status name
  }));

  return (
    <AutoCompleteSelect
      id="demo-status"
      label="Select Status"
      options={options}
      placeholder="Start typing a status…"
      onSelect={onStatusChange}
      isRequired={isRequired}
      isDisabled={isDisabled}
    />
  );
};
