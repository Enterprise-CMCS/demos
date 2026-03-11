import React, { useMemo } from "react";
import { gql, TypedDocumentNode, useQuery } from "@apollo/client";
import { Tag as DemonstrationTypeName, TagConfigurationStatus } from "demos-server";
import { AutoCompleteSelect } from "./AutoCompleteSelect";

export type DemonstrationType = {
  tagId: DemonstrationTypeName;
  approvalStatus: TagConfigurationStatus;
};

export const SELECT_DEMONSTRATION_TYPE_QUERY: TypedDocumentNode<
  { demonstrationTypes: DemonstrationType[] },
  Record<string, never>
> = gql`
  query SelectDemonstrationTypeQuery {
    demonstrationTypes {
      tagId
      approvalStatus
    }
  }
`;

export type SelectDemonstrationTypeNameProps = {
  value: DemonstrationTypeName;
  onSelect: (demonstrationTypeOption: DemonstrationType) => void;
  isRequired?: boolean;
  filter?: (tag: DemonstrationTypeName) => boolean;
};
export const SelectDemonstrationTypeName = (props: SelectDemonstrationTypeNameProps) => {
  const { filter, onSelect, ...rest } = props;

  const { loading, error, data } = useQuery(SELECT_DEMONSTRATION_TYPE_QUERY);

  const demonstrationTypeOptions = (data?.demonstrationTypes || [])
    .filter((typeOption) => (filter ? filter(typeOption.tagId) : true))
    .map((typeOption) => ({
      label: `${typeOption.tagId} ${typeOption.approvalStatus === "Approved" ? "" : "(Unapproved)"}`,
      value: typeOption.tagId,
    }));

  const placeholderText = useMemo(() => {
    if (loading) return "Loading...";
    return demonstrationTypeOptions.length ? "Select an option" : "No types available";
  }, [loading, demonstrationTypeOptions.length]);

  if (error) {
    return <p className="text-red-500">Error loading demonstration type names.</p>;
  }

  const handleSelect = (value: string) => {
    const demonstrationTypeOption = data?.demonstrationTypes.find((opt) => opt.tagId === value);
    if (demonstrationTypeOption) {
      onSelect(demonstrationTypeOption);
    }
  };

  return (
    <AutoCompleteSelect
      label="Demonstration Type"
      dataTestId="select-demonstration-type-name"
      options={demonstrationTypeOptions}
      isDisabled={demonstrationTypeOptions.length === 0}
      placeholder={placeholderText}
      onSelect={handleSelect}
      {...rest}
    />
  );
};
