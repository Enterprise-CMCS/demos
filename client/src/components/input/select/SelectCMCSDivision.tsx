import React from "react";
import { CMCS_DIVISION } from "demos-server-constants";
import { Option, Select } from "./Select";

const options: Option[] = CMCS_DIVISION.map((division) => ({
  value: division,
  label: division,
}));

export const SelectCMCSDivision = ({ onSelect }: { onSelect: (value: string) => void }) => {
  const [cmcsDivision, setCmcsDivision] = React.useState("");
  return (
    <Select
      value={cmcsDivision}
      options={options}
      placeholder="Select CMCS Division"
      onSelect={(value) => {
        setCmcsDivision(value);
        onSelect(value);
      }}
      id="cmcs-division-select"
      label="CMCS Division"
    />
  );
};
