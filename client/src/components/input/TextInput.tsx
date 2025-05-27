import React from "react";
import { Input, InputProps } from "./Input";

export const TextInput = (props: Omit<InputProps, "type">) => {
  return <Input
    type="text"
    name={props.name}
    label={props.label}
    isRequired={props.isRequired}
    isDisabled={props.isDisabled}
    placeholder={props.placeholder}
    defaultValue={props.defaultValue}
    getValidationMessage={props.getValidationMessage}
  />;
};
