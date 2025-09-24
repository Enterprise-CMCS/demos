import React from "react";
import { AutoCompleteSelect, Option } from "./AutoCompleteSelect";
import { BUNDLE_STATUS } from "demos-server-constants";

// This may not be the final type. This is more of just an example of the select.

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
  const options: Option[] = BUNDLE_STATUS.map((status) => ({
    label: status,
    value: status,
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
