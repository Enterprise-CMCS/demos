import React from "react";

import { DELIVERABLE_TYPES } from "demos-server-constants";
import { AutoCompleteSelect } from "components/input/select/AutoCompleteSelect";
import { DeliverableType } from "demos-server";

export const DELIVERABLE_TYPE_SELECT_NAME = "select-deliverable-type";
const DELIVERABLE_TYPE_OPTIONS = DELIVERABLE_TYPES.map((type) => ({ label: type, value: type }));

export const DeliverableTypeField = ({
  value,
  onSelect,
  isDisabled = false,
}: {
  value: DeliverableType;
  onSelect: (value: string) => void;
  isDisabled?: boolean;
}) => {
  return (
    <AutoCompleteSelect
      id={DELIVERABLE_TYPE_SELECT_NAME}
      dataTestId={DELIVERABLE_TYPE_SELECT_NAME}
      label="Deliverable Type"
      options={DELIVERABLE_TYPE_OPTIONS}
      value={value}
      onSelect={onSelect}
      isRequired
      isDisabled={isDisabled}
      placeholder="Select deliverable type…"
    />
  );
};
