import React from "react";
import { CMCS_DIVISION } from "demos-server-constants";
import { Option, Select } from "./Select";

const options: Option[] = CMCS_DIVISION.map((division) => ({
  value: division,
  label: division,
}));

export const SelectCMCSDivision = ({ onSelect }: { onSelect: (value: string) => void }) => {
  return (
    <Select
      options={options}
      placeholder="Select CMCS Division"
      onSelect={onSelect}
      id="cmcs-division-select"
      label="CMCS Division"
    />
  );
};
