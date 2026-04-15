import React from "react";

import { AutoCompleteMultiselect } from "components/input/select/AutoCompleteMultiselect";
import { Tag } from "demos-server";
import { Option } from "components/input/select/Select";

export const SELECT_DEMONSTRATION_TYPE_NAME = "select-demonstration-type";

export const getOptionsFromTags = (tags: Tag[]): Option[] => {
  return tags.map((tag) => ({
    value: tag.tagName,
    label: tag.approvalStatus == "Unapproved" ? `${tag.tagName} (Unapproved)` : tag.tagName,
  }));
};

export const DemonstrationTypeField = ({
  demonstrationTypeTags,
  selectedValues,
  onSelect,
  isRequired = false,
}: {
  demonstrationTypeTags: Tag[];
  selectedValues: string[];
  onSelect: (values: string[]) => void;
  isRequired?: boolean;
}) => {
  const selectOptions = getOptionsFromTags(demonstrationTypeTags);

  return (
    <AutoCompleteMultiselect
      id={SELECT_DEMONSTRATION_TYPE_NAME}
      label="Demonstration Type"
      options={selectOptions}
      values={selectedValues}
      onSelect={onSelect}
      isRequired={isRequired}
      placeholder="Select demonstration type…"
    />
  );
};
