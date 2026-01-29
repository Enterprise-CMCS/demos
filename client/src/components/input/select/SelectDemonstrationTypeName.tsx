import React, { useMemo } from "react";
import { gql, TypedDocumentNode, useQuery } from "@apollo/client";
import { Tag as DemonstrationTypeName } from "demos-server";
import { AutoCompleteSelect } from "./AutoCompleteSelect";

export const SELECT_DEMONSTRATION_TYPE_QUERY: TypedDocumentNode<
  { demonstrationTypeNames: DemonstrationTypeName[] },
  Record<string, never>
> = gql`
  query SelectDemonstrationTypeQuery {
    demonstrationTypeNames
  }
`;

export type SelectDemonstrationTypeNameProps = {
  value: DemonstrationTypeName;
  onSelect: (tag: DemonstrationTypeName) => void;
  isRequired?: boolean;
  filter?: (tag: DemonstrationTypeName) => boolean;
};
export const SelectDemonstrationTypeName = (props: SelectDemonstrationTypeNameProps) => {
  const { filter } = props;

  const { loading, error, data } = useQuery(SELECT_DEMONSTRATION_TYPE_QUERY);

  const typeNameOptions = (data?.demonstrationTypeNames || [])
    .filter((typeNames) => (filter ? filter(typeNames) : true))
    .map((typeName) => ({
      label: typeName,
      value: typeName,
    }));

  const placeholderText = useMemo(() => {
    if (loading) return "Loading...";
    return typeNameOptions.length ? "Select an option" : "No types available";
  }, [loading, typeNameOptions.length]);

  if (error) {
    return <p className="text-red-500">Error loading demonstration type names.</p>;
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
