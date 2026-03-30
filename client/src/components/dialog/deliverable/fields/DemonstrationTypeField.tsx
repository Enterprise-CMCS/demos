import React from "react";

import { AutoCompleteMultiselect } from "components/input/select/AutoCompleteMultiselect";

export const SELECT_DEMONSTRATION_TYPE_NAME = "select-demonstration-type";

export const DemonstrationTypeField = () => {
  return (
    <AutoCompleteMultiselect
      id={SELECT_DEMONSTRATION_TYPE_NAME}
      label="Demonstration Type"
      options={[]}
      onSelect={() => {}}
      placeholder="TODO: coming in next PR"
      isDisabled
    />
  );
};
