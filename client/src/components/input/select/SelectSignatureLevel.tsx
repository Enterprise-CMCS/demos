import React from "react";
import { SIGNATURE_LEVEL } from "demos-server-constants";
import { Option, Select, SelectProps } from "./Select";
import { SignatureLevel } from "demos-server";

const options: Option<SignatureLevel>[] = SIGNATURE_LEVEL.map((signatureLevel) => ({
  value: signatureLevel,
  label: signatureLevel,
}));

export const SelectSignatureLevel = ({
  placeholder = "Select Signeture Level",
  id = "signature-level-select",
  label = "Signature Level",
  ...rest
}: Omit<SelectProps<SignatureLevel>, "options">) => {
  return (
    <Select<SignatureLevel>
      options={options}
      placeholder={placeholder}
      id={id}
      label={label}
      {...rest}
    />
  );
};
