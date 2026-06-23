import React from "react";

import { SignatureLevel } from "demos-server";
import { SIGNATURE_LEVEL } from "demos-server-constants";

import { Option, Select } from "./Select";

const labelMap: Record<SignatureLevel, string> = {
  OA: "OA - Office of the Administrator",
  OCD: "OCD - Office of the Center Director",
  OGD: "OGD - Office of the Group Director",
};

export const SelectSignatureLevel = ({
  onSelect,
  initialValue,
  isDisabled = false,
  isRequired = false,
  allowedSignatureLevels = SIGNATURE_LEVEL,
}: {
  onSelect: (value: SignatureLevel | undefined) => void;
  initialValue?: SignatureLevel;
  isDisabled?: boolean;
  isRequired?: boolean;
  allowedSignatureLevels?: readonly SignatureLevel[];
}) => {
  const [signatureLevel, setSignatureLevel] = React.useState<SignatureLevel | undefined>(
    initialValue
  );

  React.useEffect(() => {
    setSignatureLevel(initialValue);
  }, [initialValue]);

  const options: Option[] = allowedSignatureLevels.map((level) => ({
    value: level,
    label: labelMap[level] || level,
  }));

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
      data-testId="signature-level-select"
      id="signature-level-select"
      label="Signature Level"
      isDisabled={isDisabled}
      isRequired={isRequired}
    />
  );
};
