import React from "react";
import { STATES_AND_TERRITORIES } from "demos-server-constants";
import { AutoCompleteSelect } from "./AutoCompleteSelect";

export const SELECT_USA_STATES_TEST_ID = "select-us-state";
import { Option } from "./Select";

export const SelectUSAStates = ({
  value,
  onSelect,
  label = "US State or Territory",
  isRequired = false,
  isDisabled = false,
}: {
  value: string;
  onSelect: (abbr: string) => void;
  label?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
}) => {
  const options: Option[] = STATES_AND_TERRITORIES.map((state) => ({
    value: state.id,
    label: state.name,
  }));

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
      value={value}
    />
  );
};
