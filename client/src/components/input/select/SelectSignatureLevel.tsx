import React from "react";

import { SignatureLevel } from "demos-server";
import { SIGNATURE_LEVEL } from "demos-server-constants";

import { Option, Select } from "./Select";

const labelMap: Record<SignatureLevel, string> = {
  OA: "OA - Office of the Administrator",
  OCD: "OCD - Office of the Center Director",
  OGD: "OGD - Office of the Group Director",
};

const options: Option[] = SIGNATURE_LEVEL.map((level) => ({
  value: level,
  label: labelMap[level] || level,
}));

export const SelectSignatureLevel = ({
  onSelect,
  initialValue,
  isDisabled = false,
  isRequired = false,
}: {
  onSelect: (value: SignatureLevel | undefined) => void;
  initialValue?: SignatureLevel;
  isDisabled?: boolean;
  isRequired?: boolean;
}) => {
  const [signatureLevel, setSignatureLevel] = React.useState<SignatureLevel | undefined>(
    initialValue
  );

  return (
    <Select
      value={signatureLevel}
      options={options}
      placeholder="Select Signature Level"
      onSelect={(value) => {
        const selectedValue = value === "" ? undefined : (value as SignatureLevel);
        setSignatureLevel(selectedValue);
        onSelect(selectedValue);
      }}
      id="signature-level-select"
      label="Signature Level"
      isDisabled={isDisabled}
      isRequired={isRequired}
    />
  );
};
