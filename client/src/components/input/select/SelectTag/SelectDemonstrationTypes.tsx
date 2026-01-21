import React from "react";
import { SelectTag } from "./SelectTag";
import { gql, useQuery } from "@apollo/client";
import { Tag } from "demos-server";

export const SELECT_DEMONSTRATION_TYPE_TAG_QUERY = gql`
  query SelectDemonstrationTagQuery {
    demonstrationTypeTags
  }
`;

export const SelectDemonstrationTypes = ({
  value,
  onSelect,
  isRequired,
  filter,
}: {
  value: Tag;
  onSelect: (value: Tag) => void;
  isRequired?: boolean;
  filter?: (type: Tag) => boolean;
}) => {
  const useDemonstrationTypeQuery = () => {
    const { loading, error, data } = useQuery<{ demonstrationTypeTags: Tag[] }>(
      SELECT_DEMONSTRATION_TYPE_TAG_QUERY
    );
    return {
      data: data ? { tags: data.demonstrationTypeTags } : undefined,
      loading,
      error,
    };
  };

  return (
    <SelectTag
      label="Demonstration Type"
      useTagQuery={useDemonstrationTypeQuery}
      value={value}
      onSelect={onSelect}
      isRequired={isRequired}
      filter={filter}
    />
  );
};
