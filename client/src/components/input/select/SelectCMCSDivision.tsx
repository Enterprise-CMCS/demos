import React from "react";

import { CmcsDivision } from "demos-server";
import { CMCS_DIVISION } from "demos-server-constants";

import {
  Option,
  Select,
} from "./Select";

const options: Option[] = CMCS_DIVISION.map((division) => ({
  value: division,
  label: division,
}));

export const SelectCMCSDivision = ({
  onSelect,
  initialValue,
}: {
  onSelect: (value: CmcsDivision) => void;
  initialValue?: CmcsDivision;
}) => {
  const [cmcsDivision, setCmcsDivision] = React.useState<CmcsDivision | undefined>(initialValue);

  React.useEffect(() => {
    setCmcsDivision(initialValue);
  }, [initialValue]);
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
