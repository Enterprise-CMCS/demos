import React from "react";
import { AutoCompleteSelect } from "./AutoCompleteSelect";
import usStates from "faker_data/states_territories.json";

interface USState {
  name: string;
  abbrev: string;
}

type Option = {
  label: string;
  value: string;
};

export const SelectUSAStates: React.FC<{
  onStateChange: (abbr: string) => void;
  isRequired?: boolean;
  isDisabled?: boolean;
}> = ({ onStateChange, isRequired = false, isDisabled = false }) => {
  const options: Option[] = (usStates as USState[]).map((state) => ({
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
