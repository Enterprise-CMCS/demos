import React from "react";
import { SDG_DIVISIONS } from "demos-server-constants";
import { Option, Select } from "./Select";
import { SdgDivision } from "demos-server";

const options: Option[] = SDG_DIVISIONS.map((division) => ({
  value: division,
  label: division,
}));

export const SelectSdgDivision = ({
  onSelect,
  initialValue,
}: {
  onSelect: (value: SdgDivision | undefined) => void;
  initialValue?: SdgDivision;
}) => {
  const [sdgDivision, setSdgDivision] = React.useState<SdgDivision | undefined>(initialValue);
  return (
    <Select
      value={sdgDivision}
      options={options}
      placeholder="Select SDG Division"
      onSelect={(value) => {
        const selectedValue = value === "" ? undefined : (value as SdgDivision);
        setSdgDivision(selectedValue);
        onSelect(selectedValue);
      }}
      id="sdg-division-select"
      label="SDG Division"
    />
  );
};
