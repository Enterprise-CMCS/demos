import React from "react";
import { SIGNATURE_LEVEL } from "demos-server-constants";
import { Option, Select } from "./Select";
import { SignatureLevel } from "demos-server";

const labelMap: Record<SignatureLevel, string> = {
  OA: "OA - Office of the Administrator",
  OCD: "OCD - Office of the Center Director",
  OGD: "OGD - Office of the Group Director",
};

const options: Option[] = SIGNATURE_LEVEL.map((level) => ({
  value: level,
  label: labelMap[level] || level,
}));

export const SelectSignatureLevel = ({ onSelect }: { onSelect: (value: string) => void }) => {
  return (
    <Select
      options={options}
      placeholder="Select Signature Level"
      onSelect={onSelect}
      id="signature-level-select"
      label="Signature Level"
    />
  );
};
