import React, { useMemo } from "react";
import { gql, TypedDocumentNode, useQuery } from "@apollo/client";
import { TagName, Tag } from "demos-server";
import { AutoCompleteSelect } from "./AutoCompleteSelect";

export const SELECT_DEMONSTRATION_TYPE_QUERY: TypedDocumentNode<
  { demonstrationTypeOptions: Tag[] },
  Record<string, never>
> = gql`
  query SelectDemonstrationTypeQuery {
    demonstrationTypeOptions {
      tagName
      approvalStatus
    }
  }
`;

export const SELECT_DEMONSTRATION_TYPE_TEST_ID = "select-demonstration-type";

const NO_MATCH_MESSAGE =
  "This demonstration type does not exist yet. Check for spelling errors and alternate names.";

export type SelectDemonstrationTypeProps = {
  value: TagName;
  onSelect: (demonstrationTypeOption: Tag) => void;
  isRequired?: boolean;
  filter?: (tag: TagName) => boolean;
  allowCreateNew?: boolean;
  onFilterChange?: (filterValue: string, hasExactMatch: boolean) => void;
  createdOptions?: Tag[];
};
export const SelectDemonstrationType = (props: SelectDemonstrationTypeProps) => {
  const {
    filter,
    onSelect,
    allowCreateNew = false,
    onFilterChange,
    createdOptions = [],
    ...rest
  } = props;

  const { loading, error, data } = useQuery(SELECT_DEMONSTRATION_TYPE_QUERY, {
    // retreive demos types tags between demonstration/extension/amendment workflows.
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
  });

  const fetchedOptions = data?.demonstrationTypeOptions || [];
  const allOptions = [...fetchedOptions, ...createdOptions];

  // Dedupe by tagName (case-sensitive, matching database behavior).
  // Needed because createdOptions may overlap with fetchedOptions after a refetch.
  const seen = new Set<string>();
  const uniqueOptions = allOptions.filter((opt) => {
    if (seen.has(opt.tagName)) return false;
    seen.add(opt.tagName);
    return true;
  });

  const demonstrationTypeOptions = uniqueOptions
    .filter((typeOption) => (filter ? filter(typeOption.tagName) : true))
    .sort((a, b) => a.tagName.localeCompare(b.tagName))
    .map((typeOption) => ({
      label: `${typeOption.tagName} ${typeOption.approvalStatus === "Approved" ? "" : "(Unapproved)"}`,
      value: typeOption.tagName,
    }));

  const placeholderText = useMemo(() => {
    if (loading) return "Loading...";
    return demonstrationTypeOptions.length || allowCreateNew
      ? "Select an option"
      : "No types available";
  }, [loading, demonstrationTypeOptions.length, allowCreateNew]);

  if (error) {
    return <p className="text-red-500">Error loading demonstration type options.</p>;
  }

  const handleSelect = (value: TagName) => {
    const demonstrationTypeOption = uniqueOptions.find((opt) => opt.tagName === value);
    if (demonstrationTypeOption) {
      onSelect(demonstrationTypeOption);
    }
  };

  const handleFilterChange = (filterValue: string) => {
    const normalizedFilterValue = filterValue.trim().toLowerCase();

    const hasExactMatch = uniqueOptions.some(
      (option) => option.tagName.trim().toLowerCase() === normalizedFilterValue
    );

    onFilterChange?.(filterValue, hasExactMatch);
  };

  return (
    <AutoCompleteSelect
      label="Demonstration Type"
      dataTestId="select-demonstration-type"
      options={demonstrationTypeOptions}
      isDisabled={demonstrationTypeOptions.length === 0 && !allowCreateNew}
      placeholder={placeholderText}
      onSelect={handleSelect}
      noMatchMessage={allowCreateNew ? NO_MATCH_MESSAGE : undefined}
      onFilterChange={handleFilterChange}
      {...rest}
    />
  );
};
