import React from "react";
import { AutoCompleteSelect } from "./AutoCompleteSelect";
import { APPLICATION_STATUS } from "demos-server-constants";
import { Option } from "./Select";

// This may not be the final type. This is more of just an example of the select.

interface SelectDemoStatusesProps {
  value: string;
  onChange: (status: string) => void;
  isRequired?: boolean;
  isDisabled?: boolean;
}

export const SelectDemoStatuses: React.FC<SelectDemoStatusesProps> = ({
  value,
  onChange,
  isRequired = false,
  isDisabled = false,
}) => {
  const options: Option[] = APPLICATION_STATUS.map((status) => ({
    label: status,
    value: status,
  }));

  return (
    <AutoCompleteSelect
      id="demo-status"
      label="Select Status"
      value={value}
      options={options}
      placeholder="Select"
      onSelect={onChange}
      isRequired={isRequired}
      isDisabled={isDisabled}
    />
  );
};
