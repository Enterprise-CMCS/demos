import React, { useMemo } from "react";
import { SelectTag } from "./SelectTag";

const mockDemonstrationTypeTags: string[] = ["Type A", "Type B", "Type C", "Type D"];

const mockDemonstrationTypeQueryResult = () => ({
  loading: false,
  error: undefined,
  data: { demonstrationTypeTags: mockDemonstrationTypeTags },
});

export const SelectDemonstrationTypeTag = ({
  value,
  onSelect,
  isRequired,
  filter,
}: {
  value: string;
  onSelect: (value: string) => void;
  isRequired?: boolean;
  filter?: (type: string) => boolean;
}) => {
  // TODO: Replace mock hook with real data fetching logic
  const useDemonstrationTypeQuery = () => {
    const { data, loading, error } = useMemo<{
      loading: boolean;
      error?: string;
      data?: { demonstrationTypeTags: string[] };
    }>(mockDemonstrationTypeQueryResult, []);
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
