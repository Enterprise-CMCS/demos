import React from "react";
import { STATES_AND_TERRITORIES } from "demos-server-constants";
import { AutoCompleteSelect } from "./AutoCompleteSelect";
import { Option } from "./Select";

export interface SelectUSAStatesProps {
  value?: string;
  onSelect: (abbr: string) => void;
  label?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
}

export const SelectUSAStates: React.FC<SelectUSAStatesProps> = ({
  value,
  onSelect,
  label = "US State or Territory",
  isRequired = false,
  isDisabled = false,
}) => {
  const options: Option[] = STATES_AND_TERRITORIES.map((state) => ({
    value: state.id,
    label: state.name,
  }));

  const selectedOption = options.find((o) => o.value === value);

  return (
    <AutoCompleteSelect
      id="us-state"
      dataTestId="select-us-state"
      label={label}
      options={options}
      placeholder={`Select ${label.toLowerCase()}…`}
      onSelect={onSelect}
      isRequired={isRequired}
      isDisabled={isDisabled}
      value={selectedOption?.value}
    />
  );
};
