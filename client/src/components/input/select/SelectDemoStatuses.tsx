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
  interface Option {
    label: string;
    value: string;
  }
  const options: Option[] = (statuses as DemonstrationStatus[]).map((state) => ({
    label: state.name,
    value: state.name,
  }));

  return (
    <AutoCompleteSelect
      id="demo-status"
      label="Select Status"
      options={options}
      placeholder="Select"
      onSelect={onStatusChange}
      isRequired={isRequired}
      isDisabled={isDisabled}
    />
  );
};
