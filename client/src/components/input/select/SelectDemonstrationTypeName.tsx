import React, { useMemo } from "react";
import { gql, useQuery } from "@apollo/client";
import { Tag } from "demos-server";
import { AutoCompleteSelect } from "./AutoCompleteSelect";

export const SELECT_DEMONSTRATION_TYPE_QUERY = gql`
  query SelectDemonstrationTypeQuery {
    demonstrationTypes
  }
`;

export type SelectDemonstrationTypeNameProps = {
  value: Tag;
  onSelect: (tag: Tag) => void;
  isRequired?: boolean;
  filter?: (tag: Tag) => boolean;
};
export const SelectDemonstrationTypeName = (props: SelectDemonstrationTypeNameProps) => {
  const { filter } = props;

  const { loading, error, data } = useQuery<{ demonstrationTypes: Tag[] }>(
    SELECT_DEMONSTRATION_TYPE_QUERY
  );

  const typeNameOptions = (data?.demonstrationTypes || [])
    .filter((demonstrationType) => (filter ? filter(demonstrationType) : true))
    .map((demonstrationType) => ({
      label: demonstrationType,
      value: demonstrationType,
    }));

  const placeholderText = useMemo(() => {
    if (loading) return "Loading...";
    return typeNameOptions.length ? "Select" : "No demonstration types available";
  }, [loading, typeNameOptions.length]);

  if (error) {
    return <p className="text-red-500">Error loading demonstration types.</p>;
  }

  return (
    <AutoCompleteSelect
      label="Demonstration Type"
      dataTestId="select-demonstration-type-name"
      options={typeNameOptions}
      isDisabled={typeNameOptions.length === 0}
      placeholder={placeholderText}
      {...props}
    />
  );
};
