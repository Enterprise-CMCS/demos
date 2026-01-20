import React, { useMemo } from "react";
import { AutoCompleteSelect } from "../AutoCompleteSelect";
import { ApolloError } from "@apollo/client";
import { Tag } from "mock-data/TagMocks";

export type SelectTagProps = {
  label: string;
  useTagQuery: () => {
    loading: boolean;
    error?: ApolloError;
    data?: { tags: Tag[] };
  };
  value: Tag;
  onSelect: (tag: Tag) => void;
  isRequired?: boolean;
  filter?: (tag: Tag) => boolean;
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
    .filter((tag) => (filter ? filter(tag) : true))
    .map((tag) => ({
      label: tag,
      value: tag,
    }));

  const placeholderText = useMemo(() => {
    if (loading) return "Loading...";
    return tagOptions.length ? "Select" : "No tags available";
  }, [loading, tagOptions.length]);

  if (error) {
    return <p className="text-red-500">Error loading tags.</p>;
  }

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
