import React from "react";
import { STATES_AND_TERRITORIES } from "demos-server-constants";
import { AutoCompleteSelect } from "./AutoCompleteSelect";
import { Option } from "./Select";

export interface SelectUSAStatesProps {
  onStateChange: (abbr: string) => void;
  label?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  currentState?: string;
  value?: string;
}

export const SelectUSAStates: React.FC<SelectUSAStatesProps> = ({
  onStateChange,
  label = "US State or Territory",
  isRequired = false,
  isDisabled = false,
  currentState,
  value,
}) => {
  const options: Option[] = STATES_AND_TERRITORIES.map((state) => ({
    value: state.id,
    label: state.name,
  }));

  const selectedValue = value ?? currentState;
  const selectedOption = options.find((o) => o.value === selectedValue);

  return (
    <AutoCompleteSelect
      id="us-state"
      label={label}
      options={options}
      placeholder={`Select ${label.toLowerCase()}…`}
      onSelect={onStateChange}
      isRequired={isRequired}
      isDisabled={isDisabled}
      value={selectedOption?.value}
      autoComplete="off"
    />
  );
};
