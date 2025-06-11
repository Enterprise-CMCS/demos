import React from "react";
import { AutoCompleteSelect, Option } from "./AutoCompleteSelect";
import { states, USState }  from "data/StatesAndTerritories";

export const SelectUSAStates: React.FC<{
  onStateChange: (abbr: string) => void;
  isRequired?: boolean;
  isDisabled?: boolean;
}> = ({ onStateChange, isRequired = false, isDisabled = false }) => {
  const options: Option[] = (states as USState[]).map((state) => ({
    label: state.name,
    value: state.abbrev,
  }));

  return (
    <AutoCompleteSelect
      id="us-state"
      label="Us State or Territory"
      options={options}
      placeholder="Select"
      onSelect={onStateChange}
      isRequired={isRequired}
      isDisabled={isDisabled}
    />
  );
};
