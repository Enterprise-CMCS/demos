import React from "react";
import { SDG_DIVISIONS } from "demos-server-constants";
import { Option, Select } from "./Select";
import { SdgDivision } from "demos-server";

const options: Option[] = SDG_DIVISIONS.map((division) => ({
  value: division,
  label: division,
}));

export const SelectSdgDivision = ({ onSelect }: { onSelect: (value: SdgDivision) => void }) => {
  const [sdgDivision, setSdgDivision] = React.useState<SdgDivision | undefined>();
  return (
    <Select
      value={sdgDivision}
      options={options}
      placeholder="Select SDG Division"
      onSelect={(value) => {
        setSdgDivision(value as SdgDivision);
        onSelect(value as SdgDivision);
      }}
      id="sdg-division-select"
      label="SDG Division"
    />
  );
};
