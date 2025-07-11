import React from "react";

import {
  states,
  USState,
} from "data/StatesAndTerritories";

import {
  AutoCompleteSelect,
  Option,
} from "./AutoCompleteSelect";

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
  const options: Option[] = (states as USState[]).map((state) => ({
    label: state.name,
    value: state.abbrev,
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
    />
  );
};
