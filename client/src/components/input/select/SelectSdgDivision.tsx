import React from "react";
import { SDG_DIVISIONS } from "demos-server-constants";
import { Option, Select, SelectProps } from "./Select";
import { SdgDivision } from "demos-server";

const options: Option<SdgDivision>[] = SDG_DIVISIONS.map((division) => ({
  value: division,
  label: division,
}));

export const SelectSdgDivision = ({
  id = "sdg-division-select",
  label = "SDG Division",
  placeholder = "Select SDG Division",
  ...rest
}: Omit<SelectProps<SdgDivision>, "options">) => {
  return (
    <Select<SdgDivision>
      options={options}
      placeholder={placeholder}
      id={id}
      label={label}
      {...rest}
    />
  );
};
