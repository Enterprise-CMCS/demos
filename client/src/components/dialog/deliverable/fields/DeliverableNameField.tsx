import React from "react";

import { TextInput } from "components/input";

export const DELIVERABLE_NAME_FIELD_ID = "deliverable-name";

export const DeliverableNameField = ({
  value,
  onChange,
  isDisabled = false,
  validationMessage,
}: {
  value: string;
  onChange: (value: string) => void;
  isDisabled?: boolean;
  validationMessage?: string;
}) => {
  return (
    <TextInput
      name={DELIVERABLE_NAME_FIELD_ID}
      label="Deliverable Name"
      isRequired
      isDisabled={isDisabled}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      getValidationMessage={() => validationMessage}
    />
  );
};
