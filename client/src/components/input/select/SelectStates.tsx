import React from "react";
import { STATES_AND_TERRITORIES } from "demos-server-constants";
import { Option, Select, SelectProps } from "./Select";
import { State } from "demos-server";

type StateId = State["id"];
const options: Option<StateId>[] = STATES_AND_TERRITORIES.map((state) => ({
  value: state.id,
  label: state.name,
}));

export const SelectStates = ({
  placeholder = "Select State",
  id = "state-select",
  label = "State",
  ...rest
}: Omit<SelectProps<StateId>, "options">) => {
  return (
    <Select<StateId> options={options} placeholder={placeholder} id={id} label={label} {...rest} />
  );
};
