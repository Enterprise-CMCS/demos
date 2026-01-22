import React, { useMemo } from "react";
import { gql, useQuery } from "@apollo/client";
import { Tag } from "demos-server";
import { AutoCompleteSelect } from "../AutoCompleteSelect";

export const SELECT_DEMONSTRATION_TYPE_QUERY = gql`
  query SelectDemonstrationTypeQuery {
    demonstrationTypes
  }
`;

export type SelectDemonstrationTypeProps = {
  value: Tag;
  onSelect: (tag: Tag) => void;
  isRequired?: boolean;
  filter?: (tag: Tag) => boolean;
};
export const SelectDemonstrationType = (props: SelectDemonstrationTypeProps) => {
  const { filter } = props;

  const { loading, error, data } = useQuery<{ demonstrationTypes: Tag[] }>(
    SELECT_DEMONSTRATION_TYPE_QUERY
  );

  const tagOptions = (data?.demonstrationTypes || [])
    .filter((demonstrationType) => (filter ? filter(demonstrationType) : true))
    .map((demonstrationType) => ({
      label: demonstrationType,
      value: demonstrationType,
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
      label="Demonstration Type"
      options={tagOptions}
      isDisabled={tagOptions.length === 0}
      placeholder={placeholderText}
      {...props}
    />
  );
};
