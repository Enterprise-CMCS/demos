import React, { useMemo } from "react";
import { AutoCompleteSelect } from "../AutoCompleteSelect";

export type SelectTagProps = {
  label: string;
  useTagQuery: () => {
    loading: boolean;
    error?: string;
    data?: { tags: string[] };
  };
  value: string;
  onSelect: (value: string) => void;
  isRequired?: boolean;
  filter?: (type: string) => boolean;
};

export const SelectTag = ({
  label,
  useTagQuery,
  value,
  onSelect,
  isRequired,
  filter,
}: SelectTagProps) => {
  const { loading, error, data } = useTagQuery();
  const tagOptions = (data?.tags || [])
    .filter((type) => (filter ? filter(type) : true))
    .map((type) => ({
      label: type,
      value: type,
    }));

  const placeholderText = useMemo(() => {
    if (loading) return "Loading...";
    if (error) return "Error loading types";
    return tagOptions.length ? "Select" : "No types available";
  }, [loading, error, tagOptions.length]);

  return (
    <AutoCompleteSelect
      isRequired={isRequired}
      label={label}
      value={value}
      options={tagOptions}
      onSelect={onSelect}
      isDisabled={tagOptions.length === 0}
      placeholder={placeholderText}
    />
  );
};
