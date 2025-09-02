import React from "react";
import { CMCS_DIVISION } from "demos-server-constants";
import { Option, Select } from "./Select";
import { CmcsDivision } from "demos-server";

const options: Option[] = CMCS_DIVISION.map((division) => ({
  value: division,
  label: division,
}));

export const SelectCMCSDivision = ({ onSelect }: { onSelect: (value: CmcsDivision) => void }) => {
  const [cmcsDivision, setCmcsDivision] = React.useState<CmcsDivision | undefined>();
  return (
    <Select
      value={cmcsDivision}
      options={options}
      placeholder="Select CMCS Division"
      onSelect={(value) => {
        setCmcsDivision(value as CmcsDivision);
        onSelect(value as CmcsDivision);
      }}
      id="cmcs-division-select"
      label="CMCS Division"
    />
  );
};
