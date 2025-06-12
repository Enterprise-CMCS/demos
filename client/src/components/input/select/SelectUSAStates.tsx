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
}

export const SelectUSAStates: React.FC<SelectUSAStatesProps> = ({
  onStateChange,
  label = "US State or Territory",
  isRequired = false,
  isDisabled = false,
  currentState,
}) => {
  const options: Option[] = (states as USState[]).map((state) => ({
    label: state.name,
    value: state.abbrev,
  }));

  const defaultLabel = options.find((o) => o.value === currentState)?.label ?? "";

  return (
    <AutoCompleteSelect
      id="us-state"
      label={label}
      options={options}
      placeholder={`Select ${label.toLowerCase()}…`}
      onSelect={onStateChange}
      isRequired={isRequired}
      isDisabled={isDisabled}
      defaultValue={defaultLabel}
    />
  );
};
