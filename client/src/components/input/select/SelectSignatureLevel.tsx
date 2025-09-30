import React from "react";

import { SignatureLevel } from "demos-server";
import { SIGNATURE_LEVEL } from "demos-server-constants";

import {
  Option,
  Select,
} from "./Select";

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
}: {
  onSelect: (value: SignatureLevel) => void;
  initialValue?: SignatureLevel;
}) => {
  const [signatureLevel, setSignatureLevel] = React.useState<SignatureLevel | undefined>(
    initialValue
  );

  React.useEffect(() => {
    setSignatureLevel(initialValue);
  }, [initialValue]);
  return (
    <Select
      value={signatureLevel}
      options={options}
      placeholder="Select Signature Level"
      onSelect={(value) => {
        setSignatureLevel(value as SignatureLevel);
        onSelect(value as SignatureLevel);
      }}
      id="signature-level-select"
      label="Signature Level"
    />
  );
};
