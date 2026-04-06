import React from "react";

import { AutoCompleteMultiselect } from "components/input/select/AutoCompleteMultiselect";

export const SELECT_DEMONSTRATION_TYPE_NAME = "select-demonstration-type";

export const DemonstrationTypeField = ({
  options,
  values,
  onSelect,
  isRequired = false,
}: {
  options: string[];
  values: string[];
  onSelect: (values: string[]) => void;
  isRequired?: boolean;
}) => {
  const selectOptions = options.map((type) => ({ label: type, value: type }));

  return (
    <AutoCompleteMultiselect
      id={SELECT_DEMONSTRATION_TYPE_NAME}
      label="Demonstration Type"
      options={selectOptions}
      values={values}
      onSelect={onSelect}
      isRequired={isRequired}
      placeholder="Select demonstration type…"
    />
  );
};
